// src/features/messages/services/ProtocolService.ts

import { Inject, OnInit, Service } from "@tsed/di";
import { ContractTransactionResponse, ethers } from "ethers";
import { Repository } from "typeorm";
import { ulid } from "ulid";

import { IProtocolCoordinator, ProtocolCoordinator } from "../../typechain/ProtocolCoordinator.js";
import { ProtocolCoordinator__factory } from "../../typechain/ProtocolCoordinator__factory.js";
import { CacheService } from "../../utils/services/CacheService.js";
import { ConfigService } from "../../utils/services/ConfigService.js";
import { LoggerService } from "../../utils/services/LoggerService.js";
import { MetricsService } from "../../utils/services/MetricsService.js";
import { Message, MessageStatus } from "../models/Message.js";
import { ProtocolSubmissionError, ValidationError } from "../types/Errors.js";
import {
    CancelResult,
    MessageStatusResult,
    ParsedMessage,
    RetryOptions,
    RetryResult,
    SubmitOptions,
    SubmitResult
} from "../types/Messages.js";
import { ISO20022MessageService } from "./ISO20022MessageService.js";
import { MessagePreprocessor } from "./MessagePreprocessor.js";

// Constants for status mapping
const PROTOCOL_STATUS_MAP: Record<string, MessageStatus> = {
    Pending: MessageStatus.PENDING,
    Processing: MessageStatus.PROCESSING,
    Completed: MessageStatus.COMPLETED,
    Failed: MessageStatus.FAILED,
    Rejected: MessageStatus.REJECTED
};

// Protocol status type
interface ProtocolStatusResponse {
    status: string;
    settlementStatus?: string;
    details?: Record<string, any>;
}

/**
 * Service for interacting with the protocol coordinator contract.
 */
@Service()
export class ProtocolService implements OnInit {
    private protocolCoordinator!: ProtocolCoordinator;
    private readonly MAX_RETRIES = 3;
    private readonly MIN_BLOCK_CONFIRMATIONS = 1;

    constructor(
        private logger: LoggerService,
        private config: ConfigService,
        private cache: CacheService,
        private metrics: MetricsService,
        private iso20022Service: ISO20022MessageService,
        private preprocessor: MessagePreprocessor,
        @Inject("DATABASE_CONNECTION") private repository: Repository<Message>
    ) {
        this.logger = logger.child({ service: "ProtocolService" });
    }

    /**
     * Initialize service and contract connection.
     */
    async $onInit(): Promise<void> {
        try {
            await this.initializeContract();
        } catch (error) {
            this.logger.error("Failed to initialize protocol service", { error });
            throw error;
        }
    }

    /**
     * Submit a message to the protocol.
     *
     * @param xml The XML content of the message.
     * @param options Additional options for message submission.
     * @returns The result of the message submission.
     */
    async submitMessage(xml: string, options: SubmitOptions = {}): Promise<SubmitResult> {
        const startTime = Date.now();

        try {
            if (!xml) {
                throw new ValidationError("XML message is required");
            }

            // 1. Parse and validate ISO20022 message
            const parsedMessage = await this.iso20022Service.parseMessage(xml);

            // 2. Create message record
            const message = await this.createMessageRecord(parsedMessage);

            // 3. Prepare submission
            const submissionData = await this.preprocessor.prepareForSubmission(message, parsedMessage);

            // 4. Format submission for contract
            const submission: IProtocolCoordinator.MessageSubmissionStruct = {
                messageType: ethers.encodeBytes32String(submissionData.messageType),
                target: submissionData.target,
                targetChain: submissionData.targetChain,
                payload: ethers.hexlify(ethers.getBytes(submissionData.payload))
            };

            // 5. Calculate fees with options consideration
            const { _baseFee, _deliveryFee } = await this.calculateFees(submission, options);

            // 6. Submit to protocol coordinator with proper options
            const tx = await this.protocolCoordinator.submitMessage(submission, {
                value: _baseFee + _deliveryFee,
                ...this.getTransactionOverrides(options)
            });

            // 7. Update message record with transaction details
            await this.updateMessageWithTransaction(message, tx);

            // 8. Record metrics
            this.recordMetrics("success", Date.now() - startTime);

            return {
                messageId: message.id,
                protocolMessageId: tx.hash,
                status: MessageStatus.PENDING
            };
        } catch (error) {
            // Record failure metrics
            this.recordMetrics("failure", Date.now() - startTime);

            if (error instanceof ValidationError) {
                throw error;
            }
            this.logger.error("Failed to submit message to protocol", { error });
            throw new ProtocolSubmissionError("Message submission failed", error as Error);
        }
    }

    /**
     * Retry a failed message submission.
     *
     * @param messageId The ID of the message to retry.
     * @param options Additional options for message retry.
     * @returns The result of the message retry.
     */
    async retryMessage(messageId: string, options: RetryOptions = {}): Promise<RetryResult> {
        try {
            // 1. Get and validate message
            const message = await this.repository.findOneOrFail({ where: { id: messageId } });

            // 2. Verify message can be retried
            await this.validateRetry(message);

            if (!message.protocol_message_id) {
                throw new ValidationError("Message has no protocol ID to retry");
            }

            // 3. Submit retry with proper options
            const tx = await this.protocolCoordinator.retryMessage(message.protocol_message_id, this.getTransactionOverrides(options));

            // 4. Update message record
            await this.updateMessageWithRetry(message, tx);

            return {
                messageId: message.id,
                newTransactionHash: tx.hash,
                status: MessageStatus.PENDING
            };
        } catch (error) {
            if (error instanceof ValidationError) {
                throw error;
            }
            this.logger.error("Failed to retry message", { messageId, error });
            throw new ProtocolSubmissionError("Message retry failed", error as Error);
        }
    }

    /**
     * Get transaction overrides from options.
     *
     * @param options The options for message submission or retry.
     * @returns The transaction overrides.
     */
    private getTransactionOverrides(options: SubmitOptions | RetryOptions) {
        return {
            ...(options.maxFee && {
                maxFeePerGas: ethers.parseUnits(options.maxFee, "gwei")
            }),
            ...(options.urgent && { priority: true })
        };
    }

    /**
     * Get message status from protocol.
     *
     * @param messageId The ID of the message to get the status for.
     * @returns The status result of the message.
     */
    async getMessageStatus(messageId: string): Promise<MessageStatusResult> {
        try {
            const message = await this.repository.findOneOrFail({ where: { id: messageId } });

            if (!message.protocol_message_id) {
                throw new ValidationError("Message has not been submitted to protocol");
            }

            const contractResult = await this.protocolCoordinator.getMessageResult(message.protocol_message_id);
            const protocolStatus: ProtocolStatusResponse = {
                status: contractResult.success ? "Completed" : "Failed",
                details: {
                    rawResult: contractResult.result
                }
            };
            return this.processProtocolStatus(message, protocolStatus);
        } catch (error) {
            this.logger.error("Failed to get message status", { messageId, error });
            throw error;
        }
    }

    /**
     * Cancel a message.
     *
     * @param messageId The ID of the message to cancel.
     * @returns The result of the message cancellation.
     */
    async cancelMessage(messageId: string): Promise<CancelResult> {
        try {
            // 1. Get and validate message
            const message = await this.repository.findOneOrFail({ where: { id: messageId } });

            // 2. Verify message can be cancelled
            if (!this.canCancelMessage(message)) {
                throw new ValidationError("Message cannot be cancelled");
            }

            // 3. Ensure protocol_message_id is defined
            if (!message.protocol_message_id) {
                throw new ValidationError("Message has no protocol ID to cancel");
            }

            // 4. Call the contract function to cancel the message
            await this.protocolCoordinator.cancelMessage(message.protocol_message_id);

            // 5. Update message record
            message.status = MessageStatus.CANCELLED;
            await this.repository.save(message);

            return {
                messageId: message.id,
                status: MessageStatus.CANCELLED,
                cancelledAt: new Date()
            };
        } catch (error) {
            this.logger.error("Failed to cancel message", { messageId, error });
            throw new ProtocolSubmissionError("Message cancellation failed", error as Error);
        }
    }

    /**
     * Check if a message can be cancelled.
     *
     * @param message The message to check.
     * @returns True if the message can be cancelled, false otherwise.
     */
    private canCancelMessage(message: Message): boolean {
        // Implement the logic to determine if a message can be cancelled
        // For example, you can check the current status of the message
        return message.status === MessageStatus.PENDING;
    }

    /**
     * Initialize the protocol coordinator contract.
     */
    private async initializeContract(): Promise<void> {
        const rpcUrl = this.config.get<string>("protocol.rpcUrl");
        const privateKey = this.config.get<string>("protocol.privateKey");
        const coordinatorAddress = this.config.get<string>("protocol.coordinatorAddress");

        if (!rpcUrl || !privateKey || !coordinatorAddress) {
            throw new Error("Missing required protocol configuration");
        }

        try {
            const provider = new ethers.JsonRpcProvider(rpcUrl);
            const signer = new ethers.Wallet(privateKey, provider);

            this.protocolCoordinator = ProtocolCoordinator__factory.connect(coordinatorAddress, signer);
            // Verify contract connection
            await this.protocolCoordinator.getAddress();
        } catch (error) {
            throw new Error(`Failed to initialize protocol contract: ${(error as Error).message}`);
        }
    }

    /**
     * Create a message record in the database.
     *
     * @param parsedMessage The parsed message data.
     * @returns The created message record.
     */
    private async createMessageRecord(parsedMessage: ParsedMessage): Promise<Message> {
        const message = new Message();
        message.id = ulid(); // Generate a unique ID for the message
        message.message_type = parsedMessage.messageType;
        message.xml_payload = parsedMessage.originalXml;
        message.parsed_payload = parsedMessage.parsedData;
        message.protocol_submission_type = parsedMessage.submissionType;
        message.status = MessageStatus.DRAFT;

        return await this.repository.save(message);
    }

    /**
     * Calculate the fees for message submission.
     *
     * @param submission The message submission data.
     * @param options The options for message submission.
     * @returns The calculated base fee and delivery fee.
     */
    private async calculateFees(submission: any, options: SubmitOptions): Promise<{ _baseFee: bigint; _deliveryFee: bigint }> {
        const { _baseFee, _deliveryFee } = await this.protocolCoordinator.quoteMessageFee(submission);

        if (options.maxFee) {
            const maxFeeWei = ethers.parseUnits(options.maxFee, "gwei");
            if (_baseFee + _deliveryFee > maxFeeWei) {
                throw new ValidationError("Required fee exceeds maximum specified");
            }
        }

        return { _baseFee, _deliveryFee };
    }

    /**
     * Update a message record with transaction details.
     *
     * @param message The message record to update.
     * @param tx The transaction response.
     */
    private async updateMessageWithTransaction(message: Message, tx: ContractTransactionResponse): Promise<void> {
        message.status = MessageStatus.SUBMITTING;
        message.transaction_hash = tx.hash;
        message.addProcessingStep("submission", "pending", {
            transactionHash: tx.hash,
            timestamp: new Date()
        });

        await this.repository.save(message);

        try {
            const receipt = await tx.wait(this.MIN_BLOCK_CONFIRMATIONS);

            if (!receipt) {
                throw new Error("Transaction receipt not available");
            }

            message.status = MessageStatus.PENDING;
            message.block_number = receipt.blockNumber.toString();
            message.block_timestamp = new Date();
            message.addProcessingStep("submission", "confirmed", {
                blockNumber: receipt.blockNumber,
                blockTimestamp: new Date()
            });
        } catch (error) {
            message.status = MessageStatus.FAILED;
            message.addProcessingStep("submission", "failed", {
                error: (error as Error).message,
                timestamp: new Date()
            });
        }

        await this.repository.save(message);
    }

    /**
     * Validate if a message can be retried.
     *
     * @param message The message to validate.
     */
    private async validateRetry(message: Message): Promise<void> {
        if (!this.canRetryMessage(message)) {
            throw new ValidationError("Message cannot be retried");
        }

        const retryCount = message.processing_metadata?.retry_count || 0;
        if (retryCount >= this.MAX_RETRIES) {
            throw new ValidationError("Maximum retry attempts exceeded");
        }
    }

    /**
     * Check if a message can be retried.
     *
     * @param message The message to check.
     * @returns True if the message can be retried, false otherwise.
     */
    private canRetryMessage(message: Message): boolean {
        return [MessageStatus.FAILED, MessageStatus.REJECTED].includes(message.status);
    }

    /**
     * Update a message record with retry details.
     *
     * @param message The message record to update.
     * @param tx The transaction response.
     */
    private async updateMessageWithRetry(message: Message, tx: ContractTransactionResponse): Promise<void> {
        message.status = MessageStatus.SUBMITTING;
        message.transaction_hash = tx.hash;
        message.addProcessingStep("retry", "pending", {
            transactionHash: tx.hash,
            timestamp: new Date()
        });

        await this.repository.save(message);

        try {
            const receipt = await tx.wait(this.MIN_BLOCK_CONFIRMATIONS);

            if (!receipt) {
                throw new Error("Transaction receipt not available");
            }

            message.status = MessageStatus.PENDING;
            message.block_number = receipt.blockNumber.toString();
            message.block_timestamp = new Date();
            message.addProcessingStep("retry", "confirmed", {
                blockNumber: receipt.blockNumber,
                blockTimestamp: new Date()
            });
        } catch (error) {
            message.status = MessageStatus.FAILED;
            message.addProcessingStep("retry", "failed", {
                error: (error as Error).message,
                timestamp: new Date()
            });
        }

        await this.repository.save(message);
    }

    private processProtocolStatus(message: Message, protocolStatus: ProtocolStatusResponse): MessageStatusResult {
        const status = PROTOCOL_STATUS_MAP[protocolStatus.status] || message.status;

        return {
            messageId: message.id,
            status,
            protocolStatus: protocolStatus.status,
            settlementStatus: protocolStatus.settlementStatus,
            lastUpdated: message.updated_at,
            details: {
                protocolMessageId: message.protocol_message_id,
                transactionHash: message.transaction_hash,
                blockNumber: message.block_number,
                blockTimestamp: message.block_timestamp,
                settlementId: message.settlement_id,
                ...protocolStatus.details
            }
        };
    }

    private recordMetrics(result: "success" | "failure", duration: number): void {
        this.metrics.incrementCounter("protocol_submissions_total", { result });
        this.metrics.observeHistogram("protocol_submission_duration_seconds", duration / 1000, {
            result
        });
    }
}
