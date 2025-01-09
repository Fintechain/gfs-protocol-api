// src/features/messages/controllers/MessageController.ts

import { Controller } from "@tsed/di";
import { BodyParams, PathParams } from "@tsed/platform-params";
import { Description, Get, Post, Returns, Status, Summary } from "@tsed/schema";

import { LoggerService } from "../../utils/services/LoggerService.js";
import { MessageTrackingService } from "../services/MessageTrackingService.js";
import { ProtocolService } from "../services/ProtocolService.js";
import {
    CancelResponse,
    MessageHistoryResponse,
    MessageTrackingResultResponse,
    RetryMessageDTO,
    RetryResponse,
    SubmitMessageDTO,
    SubmitMessageResponse
} from "../types/index.js";

/**
 * Controller for handling message-related operations.
 */
@Controller("/messages")
export class MessageController {
    constructor(
        private protocolService: ProtocolService,
        private messageTrackingService: MessageTrackingService,
        private logger: LoggerService
    ) {
        this.logger = logger.child({ controller: "MessageController" });
    }

    /**
     * Submits a new ISO20022 message to the protocol for processing.
     *
     * @param payload The message submission payload.
     * @returns The response containing the submitted message details.
     */
    @Post("/submit")
    @Summary("Submit a new message")
    @Description("Submits an ISO20022 message to the protocol for processing")
    @Returns(202, SubmitMessageResponse)
    @Status(202)
    async submitMessage(@BodyParams() payload: SubmitMessageDTO): Promise<SubmitMessageResponse> {
        try {
            this.logger.debug("Submitting message", {
                xmlLength: payload.xml.length,
                options: payload.options
            });

            const result = await this.protocolService.submitMessage(payload.xml);

            this.logger.info("Message submitted successfully", {
                messageId: result.messageId,
                protocolMessageId: result.protocolMessageId
            });

            return {
                messageId: result.messageId,
                status: result.status,
                transactionHash: result.protocolMessageId
            };
        } catch (error) {
            this.logger.error("Failed to submit message", { error });
            throw error;
        }
    }

    /**
     * Retrieves the current status of a message, including protocol and settlement status.
     *
     * @param messageId The ID of the message to retrieve the status for.
     * @returns The response containing the message status details.
     */
    @Get("/:messageId/status")
    @Summary("Get message status")
    @Description("Retrieves current status of a message including protocol and settlement status")
    @Returns(200, MessageTrackingResultResponse)
    async getMessageStatus(@PathParams("messageId") messageId: string): Promise<MessageTrackingResultResponse> {
        try {
            this.logger.debug("Getting message status", { messageId });

            const status = await this.messageTrackingService.trackMessage(messageId);

            this.logger.debug("Message status retrieved", {
                messageId,
                status: status.status
            });

            return status;
        } catch (error) {
            this.logger.error("Failed to get message status", {
                messageId,
                error
            });
            throw error;
        }
    }

    /**
     * Retrieves the complete processing history of a message.
     *
     * @param messageId The ID of the message to retrieve the history for.
     * @returns The response containing the message history details.
     */
    @Get("/:messageId/history")
    @Summary("Get message history")
    @Description("Retrieves complete processing history of a message")
    @Returns(200, MessageHistoryResponse)
    async getMessageHistory(@PathParams("messageId") messageId: string): Promise<MessageHistoryResponse> {
        try {
            this.logger.debug("Getting message history", { messageId });

            const history = await this.messageTrackingService.getMessageHistory(messageId);

            this.logger.debug("Message history retrieved", {
                messageId,
                eventCount: history.events.length
            });

            return history;
        } catch (error) {
            this.logger.error("Failed to get message history", {
                messageId,
                error
            });
            throw error;
        }
    }

    /**
     * Attempts to retry a failed message submission.
     *
     * @param messageId The ID of the message to retry.
     * @param payload The retry message payload.
     * @returns The response containing the retry details.
     */
    @Post("/:messageId/retry")
    @Summary("Retry failed message")
    @Description("Attempts to retry a failed message submission")
    @Returns(202, RetryResponse)
    @Status(202)
    async retryMessage(@PathParams("messageId") messageId: string, @BodyParams() payload: RetryMessageDTO): Promise<RetryResponse> {
        try {
            this.logger.debug("Retrying message", {
                messageId,
                options: payload.options
            });

            const result = await this.protocolService.retryMessage(messageId);

            this.logger.info("Message retry initiated", {
                messageId,
                newTransactionHash: result.newTransactionHash
            });

            return result;
        } catch (error) {
            this.logger.error("Failed to retry message", {
                messageId,
                error
            });
            throw error;
        }
    }

    /**
     * Attempts to cancel a pending message.
     *
     * @param messageId The ID of the message to cancel.
     * @returns The response containing the cancellation details.
     */
    @Post("/:messageId/cancel")
    @Summary("Cancel message")
    @Description("Attempts to cancel a pending message")
    @Returns(200, CancelResponse)
    async cancelMessage(@PathParams("messageId") messageId: string): Promise<CancelResponse> {
        try {
            this.logger.debug("Cancelling message", { messageId });

            const result = await this.protocolService.cancelMessage(messageId);

            this.logger.info("Message cancelled", {
                messageId,
                status: result.status
            });

            return result;
        } catch (error) {
            this.logger.error("Failed to cancel message", {
                messageId,
                error
            });
            throw error;
        }
    }
}
