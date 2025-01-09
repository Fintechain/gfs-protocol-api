// src/features/messages/controllers/__tests__/MessageController.spec.ts

import { beforeEach, describe, expect, it, Mock, vi } from "vitest";

import { LoggerService } from "../../../utils/services/LoggerService.js";
import { MessageStatus } from "../../models/Message.js";
import { ProtocolSubmissionError, ValidationError } from "../../types/Errors.js";
import { MessageController } from "../MessageController.js";

describe("MessageController", () => {
    let controller: MessageController;
    let protocolService: {
        submitMessage: Mock;
        retryMessage: Mock;
        cancelMessage: Mock;
    };
    let messageTrackingService: {
        trackMessage: Mock;
        getMessageHistory: Mock;
    };
    let logger: LoggerService;

    beforeEach(() => {
        // Create mock services
        protocolService = {
            submitMessage: vi.fn(),
            retryMessage: vi.fn(),
            cancelMessage: vi.fn()
        };

        messageTrackingService = {
            trackMessage: vi.fn(),
            getMessageHistory: vi.fn()
        };

        logger = {
            error: vi.fn(),
            warn: vi.fn(),
            info: vi.fn(),
            debug: vi.fn(),
            child: vi.fn().mockReturnThis()
        } as unknown as LoggerService;

        // Create controller instance
        controller = new MessageController(protocolService as any, messageTrackingService as any, logger);

        // Reset all mocks
        vi.clearAllMocks();
    });

    describe("submitMessage", () => {
        const mockSubmitPayload = {
            xml: "<xml>test</xml>",
            options: { priority: "high" as const }
        };

        const mockSubmitResult = {
            messageId: "test-id",
            status: MessageStatus.PENDING,
            protocolMessageId: "0x123"
        };

        it("should submit message successfully", async () => {
            protocolService.submitMessage.mockResolvedValue(mockSubmitResult);

            const result = await controller.submitMessage(mockSubmitPayload);

            expect(result).toEqual({
                messageId: "test-id",
                status: MessageStatus.PENDING,
                transactionHash: "0x123"
            });

            // Since we pass the payload object directly to submitMessage
            expect(protocolService.submitMessage).toHaveBeenCalledWith(mockSubmitPayload.xml);
            expect(logger.info).toHaveBeenCalledWith("Message submitted successfully", expect.any(Object));
        });

        it("should handle validation errors", async () => {
            protocolService.submitMessage.mockRejectedValue(new ValidationError("Invalid message"));

            await expect(controller.submitMessage(mockSubmitPayload)).rejects.toThrow(ValidationError);

            expect(logger.error).toHaveBeenCalledWith("Failed to submit message", expect.any(Object));
        });

        it("should handle protocol submission errors", async () => {
            protocolService.submitMessage.mockRejectedValue(new ProtocolSubmissionError("Submission failed", new Error()));

            await expect(controller.submitMessage(mockSubmitPayload)).rejects.toThrow(ProtocolSubmissionError);
        });
    });

    describe("getMessageStatus", () => {
        const mockStatusResult = {
            messageId: "test-id",
            status: MessageStatus.PENDING,
            details: {},
            lastUpdated: new Date()
        };

        it("should get message status successfully", async () => {
            messageTrackingService.trackMessage.mockResolvedValue(mockStatusResult);

            const result = await controller.getMessageStatus("test-id");

            expect(result).toEqual(mockStatusResult);
            expect(messageTrackingService.trackMessage).toHaveBeenCalledWith("test-id");
            expect(logger.debug).toHaveBeenCalledWith("Message status retrieved", expect.any(Object));
        });

        it("should handle not found errors", async () => {
            messageTrackingService.trackMessage.mockRejectedValue(new Error("Message not found"));

            await expect(controller.getMessageStatus("test-id")).rejects.toThrow();
            expect(logger.error).toHaveBeenCalledWith("Failed to get message status", expect.any(Object));
        });
    });

    describe("getMessageHistory", () => {
        const mockHistory = {
            messageId: "test-id",
            currentStatus: MessageStatus.PENDING,
            events: [
                {
                    type: "created",
                    timestamp: new Date(),
                    details: {}
                }
            ],
            processingSteps: [],
            validations: [],
            transactions: []
        };

        it("should get message history successfully", async () => {
            messageTrackingService.getMessageHistory.mockResolvedValue(mockHistory);

            const result = await controller.getMessageHistory("test-id");

            expect(result).toEqual(mockHistory);
            expect(messageTrackingService.getMessageHistory).toHaveBeenCalledWith("test-id");
            expect(logger.debug).toHaveBeenCalledWith("Message history retrieved", expect.any(Object));
        });

        it("should handle history retrieval errors", async () => {
            messageTrackingService.getMessageHistory.mockRejectedValue(new Error("History not found"));

            await expect(controller.getMessageHistory("test-id")).rejects.toThrow();
            expect(logger.error).toHaveBeenCalledWith("Failed to get message history", expect.any(Object));
        });
    });

    describe("retryMessage", () => {
        const mockRetryPayload = {
            options: { priority: "high" as const }
        };

        const mockRetryResult = {
            messageId: "test-id",
            newTransactionHash: "0x456",
            status: MessageStatus.PENDING
        };

        it("should retry message successfully", async () => {
            protocolService.retryMessage.mockResolvedValue(mockRetryResult);

            const result = await controller.retryMessage("test-id", mockRetryPayload);

            expect(result).toEqual(mockRetryResult);
            // The controller only passes messageId to retryMessage
            expect(protocolService.retryMessage).toHaveBeenCalledWith("test-id");
            expect(logger.info).toHaveBeenCalledWith("Message retry initiated", expect.any(Object));
        });

        it("should handle retry validation errors", async () => {
            protocolService.retryMessage.mockRejectedValue(new ValidationError("Cannot retry message"));

            await expect(controller.retryMessage("test-id", mockRetryPayload)).rejects.toThrow(ValidationError);
            expect(logger.error).toHaveBeenCalledWith("Failed to retry message", expect.any(Object));
        });
    });

    describe("cancelMessage", () => {
        const mockCancelResult = {
            messageId: "test-id",
            status: MessageStatus.CANCELLED,
            cancelledAt: new Date()
        };

        it("should cancel message successfully", async () => {
            protocolService.cancelMessage.mockResolvedValue(mockCancelResult);

            const result = await controller.cancelMessage("test-id");

            expect(result).toEqual(mockCancelResult);
            expect(protocolService.cancelMessage).toHaveBeenCalledWith("test-id");
            expect(logger.info).toHaveBeenCalledWith("Message cancelled", expect.any(Object));
        });

        it("should handle cancellation errors", async () => {
            protocolService.cancelMessage.mockRejectedValue(new ValidationError("Cannot cancel message"));

            await expect(controller.cancelMessage("test-id")).rejects.toThrow(ValidationError);
            expect(logger.error).toHaveBeenCalledWith("Failed to cancel message", expect.any(Object));
        });
    });
});
