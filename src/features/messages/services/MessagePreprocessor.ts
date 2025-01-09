// src/features/messages/services/MessagePreprocessor.ts

import { Service } from "@tsed/di";

import { ConfigService } from "../../utils/services/ConfigService.js";
import { LoggerService } from "../../utils/services/LoggerService.js";
import { Message, ProtocolSubmissionType } from "../models/Message.js";
import { ValidationError } from "../types/Errors.js";
import { ParsedMessage, ProtocolSubmission } from "../types/Messages.js";

@Service()
export class MessagePreprocessor {
    constructor(
        private logger: LoggerService,
        private config: ConfigService
    ) {
        this.logger = logger.child({ service: "MessagePreprocessor" });
    }

    /**
     * Prepare message for protocol submission
     */
    async prepareForSubmission(message: Message, parsedMessage: ParsedMessage): Promise<ProtocolSubmission> {
        try {
            // 1. Determine target chain
            const targetChain = await this.determineTargetChain(parsedMessage);

            // 2. Build protocol payload based on message type
            const payload = await this.buildProtocolPayload(message, parsedMessage);

            // 3. Validate institutions are registered
            await this.validateInstitutions(parsedMessage);

            // 4. Build submission metadata
            const metadata = this.buildSubmissionMetadata(message, parsedMessage);

            return {
                messageType: message.protocol_submission_type,
                payload,
                target: message.target_address!,
                targetChain,
                metadata,
                options: {
                    urgent: false // Default to non-urgent
                }
            };
        } catch (error) {
            this.logger.error("Failed to prepare message for submission", { error });
            throw error;
        }
    }

    /**
     * Prepare for message retry
     */
    async prepareForRetry(message: Message): Promise<ProtocolSubmission> {
        try {
            // 1. Validate message can be retried
            if (!this.canRetryMessage(message)) {
                throw new ValidationError("Message cannot be retried");
            }

            // 2. Build retry payload
            const payload = await this.buildRetryPayload(message);

            // 3. Update retry metadata
            const metadata = this.buildRetryMetadata(message);

            return {
                messageType: message.protocol_submission_type,
                payload,
                targetChain: message.target_chain_id!,
                target: message.target_address!, // Add this line
                metadata,
                options: {
                    urgent: false
                }
            };
        } catch (error) {
            this.logger.error("Failed to prepare message retry", { error });
            throw error;
        }
    }

    private async determineTargetChain(parsedMessage: ParsedMessage): Promise<number> {
        // Determine target chain based on creditor agent and message type
        const { creditorAgent } = parsedMessage.details;

        // Example: Look up chain mapping from configuration
        const chainMapping = this.config.get<Record<string, number>>("protocol.chainMapping");
        const targetChain = chainMapping[creditorAgent];

        if (!targetChain) {
            throw new ValidationError(`No chain mapping found for agent: ${creditorAgent}`);
        }

        return targetChain;
    }

    private async buildProtocolPayload(message: Message, parsedMessage: ParsedMessage): Promise<any> {
        switch (message.protocol_submission_type) {
            case ProtocolSubmissionType.PACS_008:
                return this.buildPacs008Payload(parsedMessage);
            case ProtocolSubmissionType.PACS_009:
                return this.buildPacs009Payload(parsedMessage);
            default:
                throw new ValidationError(`Unsupported message type: ${message.protocol_submission_type}`);
        }
    }

    private async buildPacs008Payload(parsedMessage: ParsedMessage): Promise<any> {
        const { details } = parsedMessage;

        // Structure payload according to PACS.008 handler requirements
        return {
            debtorAgent: details.debtorAgent,
            creditorAgent: details.creditorAgent,
            amount: details.amount,
            currency: details.currency,
            instructionId: details.messageId
            // Add additional fields as required by the protocol
        };
    }

    private async buildPacs009Payload(parsedMessage: ParsedMessage): Promise<any> {
        const { details } = parsedMessage;

        // Structure payload according to PACS.009 handler requirements
        return {
            debtorAgent: details.debtorAgent,
            creditorAgent: details.creditorAgent,
            amount: details.amount,
            currency: details.currency,
            instructionId: details.messageId
            // Add additional fields as required by the protocol
        };
    }

    private async validateInstitutions(parsedMessage: ParsedMessage): Promise<void> {
        // Validate both debtor and creditor agents are registered in the protocol
        const { debtorAgent, creditorAgent } = parsedMessage.details;

        // Example: Check against protocol registry
        if (!this.isInstitutionRegistered(debtorAgent)) {
            throw new ValidationError(`Debtor agent not registered: ${debtorAgent}`);
        }

        if (!this.isInstitutionRegistered(creditorAgent)) {
            throw new ValidationError(`Creditor agent not registered: ${creditorAgent}`);
        }
    }

    private isInstitutionRegistered(agent: string): boolean {
        // Implementation would check against protocol's institution registry
        return true; // Placeholder
    }

    private buildSubmissionMetadata(message: Message, parsedMessage: ParsedMessage): Record<string, any> {
        return {
            messageId: message.id,
            originalMessageId: parsedMessage.details.messageId,
            submissionTimestamp: new Date().toISOString(),
            messageType: message.message_type,
            protocolType: message.protocol_submission_type
        };
    }

    private buildRetryMetadata(message: Message): Record<string, any> {
        return {
            originalMessageId: message.id,
            retryTimestamp: new Date().toISOString(),
            previousTransactionHash: message.transaction_hash,
            retryCount: (message.processing_metadata?.retry_count || 0) + 1
        };
    }

    private canRetryMessage(message: Message): boolean {
        const maxRetries = this.config.get<number>("protocol.maxRetries", 3);
        const currentRetries = message.processing_metadata?.retry_count || 0;

        return currentRetries < maxRetries;
    }

    private async buildRetryPayload(message: Message): Promise<any> {
        // For retries, we typically use the original payload with updated metadata
        return {
            ...message.protocol_payload,
            retryCount: (message.processing_metadata?.retry_count || 0) + 1,
            originalTransactionHash: message.transaction_hash
        };
    }
}
