// src/features/messages/services/ProtocolEventService.ts

import { Inject, Service } from "@tsed/di";
import { EventEmitterService } from "@tsed/event-emitter";
import { ethers } from "ethers";

import { LoggerService } from "../../utils/services/LoggerService.js";
import { MetricsService } from "../../utils/services/MetricsService.js";
import { Message, MessageStatus } from "../models/Message.js";
import { EventProcessingError } from "../types/Errors.js";

/**
 * Service responsible for handling protocol-level events from the blockchain.
 * This service listens for events from the Protocol Coordinator contract and
 * updates the local message state accordingly.
 */
@Service()
export class ProtocolEventService {
    /**
     * Creates a new instance of the ProtocolEventService.
     *
     * @param logger - Service for structured logging
     * @param metrics - Service for metrics collection
     * @param eventEmitter - Service for emitting local events
     * @param protocolCoordinator - Protocol coordinator contract instance
     * @param repository - Database repository for message persistence
     */
    constructor(
        private logger: LoggerService,
        private metrics: MetricsService,
        private eventEmitter: EventEmitterService,
        @Inject("COORDINATOR_CONTRACT") private protocolCoordinator: ethers.Contract,
        @Inject("DATABASE_CONNECTION") private repository: any
    ) {
        if (!protocolCoordinator) {
            throw new Error("Protocol coordinator contract is required but was not provided");
        }

        this.logger = logger.child({ service: "ProtocolEventService" });
        this.initializeEventListeners();
    }

    /**
     * Initialize protocol event listeners.
     * Sets up event handlers for all relevant protocol events:
     * - MessageSubmissionInitiated: When a new message is submitted
     * - MessageProcessingCompleted: When message processing is completed
     * - MessageRetryInitiated: When a message retry is initiated
     *
     * @throws Error if protocol coordinator is undefined
     */
    protected initializeEventListeners(): void {
        if (!this.protocolCoordinator) {
            throw new Error("Cannot initialize event listeners: Protocol coordinator contract is undefined");
        }

        // Listen for message submission events
        this.protocolCoordinator.on(
            this.protocolCoordinator.filters.MessageSubmissionInitiated(),
            async (messageId: string, sender: string, messageType: string, target: string, targetChain: bigint, event: any) => {
                try {
                    await this.handleMessageSubmitted(messageId, sender, event);
                } catch (error) {
                    this.logger.error("Failed to handle MessageSubmissionInitiated event", { error });
                }
            }
        );

        // Listen for message processing completion
        this.protocolCoordinator.on(
            this.protocolCoordinator.filters.MessageProcessingCompleted(),
            async (messageId: string, event: any) => {
                try {
                    await this.handleMessageStatusUpdated(messageId, "COMPLETED", event);
                } catch (error) {
                    this.logger.error("Failed to handle MessageProcessingCompleted event", { error });
                }
            }
        );

        // Listen for retry events
        this.protocolCoordinator.on(this.protocolCoordinator.filters.MessageRetryInitiated(), async (messageId: string, event: any) => {
            try {
                await this.handleRetryInitiated(messageId, event);
            } catch (error) {
                this.logger.error("Failed to handle MessageRetryInitiated event", { error });
            }
        });
    }

    /**
     * Handle message submission event.
     * Updates the message status to PENDING and records submission details.
     *
     * @param messageId - Unique identifier of the message
     * @param sender - Address of the message sender
     * @param event - Event data from the blockchain
     * @throws EventProcessingError if message is not found or processing fails
     */
    protected async handleMessageSubmitted(messageId: string, sender: string, event: any): Promise<void> {
        try {
            const message = await this.repository.findOne({
                where: { protocol_message_id: messageId }
            });

            if (!message) {
                throw new EventProcessingError("Message not found for submission event", "MessageSubmissionInitiated");
            }

            // Update message with submission details
            message.status = MessageStatus.PENDING;
            message.block_number = event.blockNumber.toString();
            message.block_timestamp = new Date();
            message.addProcessingStep("submission", "confirmed", {
                blockNumber: event.blockNumber,
                transactionHash: event.transactionHash
            });

            await this.repository.save(message);

            // Emit local event for submission confirmation
            await this.eventEmitter.emit("message.submitted", {
                messageId: message.id,
                protocolMessageId: messageId,
                timestamp: new Date()
            });

            // Record metric for message submission
            this.metrics.incrementCounter("protocol_events", { type: "message_submitted" });
        } catch (error) {
            throw new EventProcessingError(
                "Failed to process MessageSubmissionInitiated event",
                "MessageSubmissionInitiated",
                error as Error
            );
        }
    }

    /**
     * Handle message status update event.
     * Updates the message status and records the status change details.
     *
     * @param messageId - Unique identifier of the message
     * @param status - New status of the message
     * @param event - Event data from the blockchain
     * @throws EventProcessingError if message is not found or processing fails
     */
    protected async handleMessageStatusUpdated(messageId: string, status: string, event: any): Promise<void> {
        try {
            const message = await this.repository.findOne({
                where: { protocol_message_id: messageId }
            });

            if (!message) {
                throw new EventProcessingError("Message not found for status update", "MessageProcessingCompleted");
            }

            // Map and update message status
            const newStatus = this.mapProtocolStatus(status);
            message.status = newStatus;
            message.addProcessingStep("status_update", status, {
                previousStatus: message.status,
                blockNumber: event.blockNumber,
                timestamp: new Date()
            });

            await this.repository.save(message);

            // Emit local event for status update
            await this.eventEmitter.emit("message.status_updated", {
                messageId: message.id,
                protocolMessageId: messageId,
                status: newStatus,
                timestamp: new Date()
            });

            // Record metric for status update
            this.metrics.incrementCounter("protocol_events", {
                type: "status_updated",
                status: newStatus
            });
        } catch (error) {
            throw new EventProcessingError(
                "Failed to process MessageProcessingCompleted event",
                "MessageProcessingCompleted",
                error as Error
            );
        }
    }

    /**
     * Handle message retry initiation event.
     * Updates the retry count and records retry attempt details.
     *
     * @param messageId - Unique identifier of the message
     * @param event - Event data from the blockchain
     * @throws EventProcessingError if message is not found or processing fails
     */
    protected async handleRetryInitiated(messageId: string, event: any): Promise<void> {
        try {
            const message = await this.repository.findOne({
                where: { protocol_message_id: messageId }
            });

            if (!message) {
                throw new EventProcessingError("Message not found for retry initiation", "MessageRetryInitiated");
            }

            // Initialize or update retry count
            if (!message.processing_metadata) {
                message.processing_metadata = { retry_count: 0 };
            }
            message.processing_metadata.retry_count++;

            // Record retry attempt details
            message.addProcessingStep("retry", "initiated", {
                retryCount: message.processing_metadata.retry_count,
                blockNumber: event.blockNumber,
                timestamp: new Date()
            });

            await this.repository.save(message);

            // Emit local event for retry initiation
            await this.eventEmitter.emit("message.retry_initiated", {
                messageId: message.id,
                protocolMessageId: messageId,
                retryCount: message.processing_metadata.retry_count,
                timestamp: new Date()
            });

            // Record metric for retry initiation
            this.metrics.incrementCounter("protocol_events", { type: "retry_initiated" });
        } catch (error) {
            throw new EventProcessingError("Failed to process MessageRetryInitiated event", "MessageRetryInitiated", error as Error);
        }
    }

    /**
     * Map protocol status to internal message status.
     *
     * @param protocolStatus - Status string from the protocol
     * @returns Corresponding internal MessageStatus
     */
    private mapProtocolStatus(protocolStatus: string): MessageStatus {
        const statusMap: Record<string, MessageStatus> = {
            PENDING: MessageStatus.PENDING,
            PROCESSING: MessageStatus.PROCESSING,
            COMPLETED: MessageStatus.COMPLETED,
            FAILED: MessageStatus.FAILED,
            REJECTED: MessageStatus.REJECTED
        };

        return statusMap[protocolStatus] || MessageStatus.FAILED;
    }
}
