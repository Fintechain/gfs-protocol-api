// src/features/messages/controllers/__tests__/TransformationController.spec.ts

import { beforeEach, describe, expect, it, Mock, vi } from "vitest";

import { LoggerService } from "../../../utils/services/LoggerService.js";
import { TransformationType } from "../../models/MessageTransformation.js";
import { TransformationError } from "../../types/Errors.js";
import { TransformMessageDTO, TransformResultDTO } from "../../types/MessageDTO.js";
import { TransformationController } from "../TransformationController.js";

describe("TransformationController", () => {
    let controller: TransformationController;
    let iso20022Service: { parseMessage: Mock };
    let logger: LoggerService;

    const mockParsedMessage = {
        messageType: "pacs.008",
        submissionType: "pacs.008",
        originalXml: "<xml>test</xml>",
        parsedData: { test: "data" },
        details: {
            messageId: "test-id",
            creationDate: new Date()
        }
    };

    beforeEach(() => {
        // Create mock services
        iso20022Service = {
            parseMessage: vi.fn()
        };

        logger = {
            error: vi.fn(),
            warn: vi.fn(),
            info: vi.fn(),
            debug: vi.fn(),
            child: vi.fn().mockReturnThis()
        } as unknown as LoggerService;

        // Create controller instance
        controller = new TransformationController(iso20022Service as any, logger);

        // Reset all mocks
        vi.clearAllMocks();
    });

    describe("transformMessage", () => {
        const mockPayload = new TransformMessageDTO("<xml>test</xml>", "protocol");

        it("should transform message successfully", async () => {
            iso20022Service.parseMessage.mockResolvedValue(mockParsedMessage);

            const result = await controller.transformMessage(mockPayload);

            expect(result).toBeInstanceOf(TransformResultDTO);
            expect(result.transformed).toBe(true);
            expect(result.sourceFormat).toBe(mockParsedMessage.messageType);
            expect(result.targetFormat).toBe(mockPayload.targetFormat);
            expect(result.metadata).toEqual({
                transformationType: TransformationType.ISO20022_TO_MT,
                timestamp: expect.any(Date)
            });

            expect(iso20022Service.parseMessage).toHaveBeenCalledWith(mockPayload.xml);
            expect(logger.info).toHaveBeenCalledWith("Transformation completed", expect.any(Object));
        });

        it("should validate supported transformations", async () => {
            const unsupportedPayload = new TransformMessageDTO("<xml>test</xml>", "unsupported_format");
            iso20022Service.parseMessage.mockResolvedValue(mockParsedMessage);

            await expect(controller.transformMessage(unsupportedPayload)).rejects.toThrow(TransformationError);
            expect(logger.error).toHaveBeenCalledWith("Transformation failed", expect.any(Object));
        });

        it("should handle message parsing errors", async () => {
            const parseError = new Error("Invalid XML");
            iso20022Service.parseMessage.mockRejectedValue(parseError);

            await expect(controller.transformMessage(mockPayload)).rejects.toThrow(TransformationError);
            expect(logger.error).toHaveBeenCalledWith(
                "Transformation failed",
                expect.objectContaining({
                    error: parseError
                })
            );
        });

        it("should handle empty input", async () => {
            const emptyPayload = new TransformMessageDTO("", "protocol");

            await expect(controller.transformMessage(emptyPayload)).rejects.toThrow(TransformationError);
        });

        it("should validate target format", async () => {
            iso20022Service.parseMessage.mockResolvedValue({
                ...mockParsedMessage,
                messageType: "unknown"
            });

            await expect(controller.transformMessage(mockPayload)).rejects.toThrow(TransformationError);
        });

        it("should handle transformation options", async () => {
            const payloadWithOptions = new TransformMessageDTO("<xml>test</xml>", "protocol", { strict: true });
            iso20022Service.parseMessage.mockResolvedValue(mockParsedMessage);

            await controller.transformMessage(payloadWithOptions);

            expect(logger.debug).toHaveBeenCalledWith(
                "Starting message transformation",
                expect.objectContaining({
                    targetFormat: payloadWithOptions.targetFormat
                })
            );
        });
    });

    describe("Supported Transformations", () => {
        it("should support ISO20022 to Protocol format", async () => {
            const payload = new TransformMessageDTO("<xml>test</xml>", "protocol");
            iso20022Service.parseMessage.mockResolvedValue({
                messageType: "pacs.008"
            });

            const result = await controller.transformMessage(payload);
            expect(result.transformed).toBe(true);
        });

        it("should support ISO20022 to MT format", async () => {
            const payload = new TransformMessageDTO("<xml>test</xml>", "mt103");
            iso20022Service.parseMessage.mockResolvedValue({
                messageType: "pacs.008"
            });

            const result = await controller.transformMessage(payload);
            expect(result.transformed).toBe(true);
        });

        it("should handle unsupported source formats", async () => {
            const payload = new TransformMessageDTO("<xml>test</xml>", "protocol");
            iso20022Service.parseMessage.mockResolvedValue({
                messageType: "unsupported"
            });

            await expect(controller.transformMessage(payload)).rejects.toThrow(TransformationError);
        });

        it("should validate format combinations", async () => {
            const payload = new TransformMessageDTO("<xml>test</xml>", "mt202");
            iso20022Service.parseMessage.mockResolvedValue({
                messageType: "pacs.008" // pacs.008 can only go to mt103
            });

            await expect(controller.transformMessage(payload)).rejects.toThrow(TransformationError);
        });
    });
});
