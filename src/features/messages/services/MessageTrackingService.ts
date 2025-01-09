// src/features/messages/services/MessageTrackingService.ts

import { Inject, Service } from "@tsed/di";
import { ethers } from "ethers";

import { CacheService } from "../../utils/services/CacheService.js";
import { LoggerService } from "../../utils/services/LoggerService.js";
import { Message, MessageStatus } from "../models/Message.js";
import { MessageTrackingError } from "../types/Errors.js";
import { MessageHistory, MessageHistoryEvent, MessageTrackingResult, TransactionEvent } from "../types/Messages.js";

@Service()
export class MessageTrackingService {
    private readonly STATUS_CACHE_TTL = 60; // 1 minute

    constructor(
        private logger: LoggerService,
        private cache: CacheService,
        @Inject("COORDINATOR_CONTRACT") private protocolCoordinator: ethers.Contract,
        @Inject("DATABASE_CONNECTION") private repository: any
    ) {
        this.logger = logger.child({ service: "MessageTrackingService" });
    }

    /**
     * Track message status
     */
    async trackMessage(messageId: string): Promise<MessageTrackingResult> {
        try {
            // Try cache first
            const cachedStatus = await this.getCachedStatus(messageId);
            if (cachedStatus) {
                return cachedStatus;
            }

            // Get message from database
            const message = await this.repository.findOne(Message, messageId, {
                relations: ["validations", "transformations"]
            });

            if (!message) {
                throw new MessageTrackingError("Message not found", messageId);
            }

            // Get protocol status if message has been submitted
            let protocolStatus;
            if (message.protocol_message_id) {
                protocolStatus = await this.protocolCoordinator.getMessageResult(message.protocol_message_id);
            }

            // Get settlement status if applicable
            let settlementStatus;
            if (message.settlement_id) {
                settlementStatus = await this.getSettlementStatus(message);
            }

            // Combine all status information
            const result = this.consolidateStatus(message, protocolStatus, settlementStatus);

            // Cache the result
            await this.cacheStatus(messageId, result);

            return result;
        } catch (error) {
            this.logger.error("Failed to track message", { messageId, error });
            throw new MessageTrackingError("Failed to track message status", messageId, error as Error);
        }
    }

    /**
     * Get message history
     */
    async getMessageHistory(messageId: string): Promise<MessageHistory> {
        try {
            const message = await this.repository.findOne(Message, messageId, {
                relations: ["validations", "transformations"]
            });

            if (!message) {
                throw new MessageTrackingError("Message not found", messageId);
            }

            return {
                messageId: message.id,
                currentStatus: message.status,
                events: this.buildHistoryEvents(message),
                processingSteps: message.processing_metadata?.processing_steps || [],
                validations: message.validations.map((v: any) => ({
                    timestamp: v.created_at,
                    type: v.validation_type,
                    result: v.result,
                    details: v.details
                })),
                transactions: this.buildTransactionHistory(message)
            };
        } catch (error) {
            this.logger.error("Failed to get message history", { messageId, error });
            throw new MessageTrackingError("Failed to retrieve message history", messageId, error as Error);
        }
    }

    private async getCachedStatus(messageId: string): Promise<MessageTrackingResult | null> {
        const cacheKey = `message-status:${messageId}`;
        return this.cache.get<MessageTrackingResult>(cacheKey);
    }

    private async cacheStatus(messageId: string, status: MessageTrackingResult): Promise<void> {
        const cacheKey = `message-status:${messageId}`;
        await this.cache.set(cacheKey, status, { ttl: this.STATUS_CACHE_TTL });
    }

    private async getSettlementStatus(message: Message): Promise<any> {
        // Implementation would call settlement service or contract
        return null;
    }

    private consolidateStatus(message: Message, protocolStatus?: any, settlementStatus?: any): MessageTrackingResult {
        const status = this.determineOverallStatus(message.status, protocolStatus?.status, settlementStatus?.status);

        return {
            messageId: message.id,
            status,
            details: {
                protocolMessageId: message.protocol_message_id,
                transactionHash: message.transaction_hash,
                blockNumber: message.block_number,
                blockTimestamp: message.block_timestamp,
                settlementId: message.settlement_id,
                protocolStatus: protocolStatus?.status,
                settlementStatus: settlementStatus?.status
            },
            lastUpdated: message.updated_at
        };
    }

    private determineOverallStatus(messageStatus: MessageStatus, protocolStatus?: string, settlementStatus?: string): MessageStatus {
        // Complex logic to determine overall status based on all inputs
        // Implementation would depend on business rules
        return messageStatus;
    }

    private buildHistoryEvents(message: Message): Array<MessageHistoryEvent> {
        const events: MessageHistoryEvent[] = [];

        // Add creation event
        events.push({
            type: "created",
            timestamp: message.created_at,
            details: { messageType: message.message_type }
        });

        // Add processing steps
        if (message.processing_metadata?.processing_steps) {
            events.push(
                ...message.processing_metadata.processing_steps.map((step) => ({
                    type: step.step,
                    timestamp: new Date(step.timestamp),
                    details: step.details
                }))
            );
        }

        return events;
    }

    private buildTransactionHistory(message: Message): Array<TransactionEvent> {
        const transactions: TransactionEvent[] = [];

        if (message.transaction_hash) {
            transactions.push({
                type: "submission",
                transactionHash: message.transaction_hash,
                blockNumber: message.block_number,
                timestamp: message.block_timestamp
            });
        }

        return transactions;
    }
}
