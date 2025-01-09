// src/features/messages/services/__tests__/MessagePreprocessor.spec.ts

import { PlatformTest } from "@tsed/platform-http/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ConfigService } from "../../../utils/services/ConfigService.js";
import { LoggerService } from "../../../utils/services/LoggerService.js";
import { Message, MessageStatus, ProtocolSubmissionType } from "../../models/Message.js";
import { ValidationError } from "../../types/Errors.js";
import { ParsedMessage } from "../../types/Messages.js";
import { MessagePreprocessor } from "../MessagePreprocessor.js";

describe("MessagePreprocessor", () => {
    let service: MessagePreprocessor;
    let logger: LoggerService;
    let config: ConfigService;

    // Create a helper for type-safe parsed messages
    const createParsedMessage = (overrides: Partial<ParsedMessage> = {}): ParsedMessage => ({
        messageType: "pacs.008",
        submissionType: ProtocolSubmissionType.PACS_008,
        originalXml: "<xml>test</xml>",
        parsedData: {},
        details: {
            debtorAgent: "TESTBANK",
            creditorAgent: "TESTBANK",
            amount: "100",
            currency: "USD",
            messageId: "test-id",
            creationDate: new Date("2024-01-01T00:00:00Z")
        },
        ...overrides
    });

    beforeEach(async () => {
        // Create mock logger
        logger = {
            error: vi.fn(),
            warn: vi.fn(),
            info: vi.fn(),
            debug: vi.fn(),
            child: vi.fn().mockReturnThis()
        } as unknown as LoggerService;

        // Create mock config
        config = {
            get: vi.fn()
        } as unknown as ConfigService;

        // Create fresh platform test instance
        await PlatformTest.create();

        // Create service instance
        service = new MessagePreprocessor(logger, config);
    });

    describe("prepareForSubmission", () => {
        it("should successfully prepare PACS.008 message for submission", async () => {
            // Mock config responses
            (config.get as any).mockImplementation((key: string) => {
                if (key === "protocol.chainMapping") {
                    return { TESTBANK: 1 };
                }
                return null;
            });

            // Create test message and parsed data
            const message = new Message();
            message.id = "test-id";
            message.protocol_submission_type = ProtocolSubmissionType.PACS_008;
            message.message_type = "pacs.008";

            const parsedMessage = createParsedMessage();

            const result = await service.prepareForSubmission(message, parsedMessage);

            // Verify result structure
            expect(result).toEqual({
                messageType: ProtocolSubmissionType.PACS_008,
                payload: {
                    debtorAgent: "TESTBANK",
                    creditorAgent: "TESTBANK",
                    amount: "100",
                    currency: "USD",
                    instructionId: "test-id"
                },
                targetChain: 1,
                metadata: {
                    messageId: "test-id",
                    originalMessageId: "test-id",
                    submissionTimestamp: expect.any(String),
                    messageType: "pacs.008",
                    protocolType: ProtocolSubmissionType.PACS_008
                },
                options: {
                    urgent: false
                }
            });
        });

        it("should handle unsupported message types", async () => {
            // Mock config response for chain mapping
            (config.get as any).mockImplementation((key: string) => {
                if (key === "protocol.chainMapping") {
                    return { TESTBANK: 1 };
                }
                return null;
            });

            const message = new Message();
            message.protocol_submission_type = "unsupported" as ProtocolSubmissionType;
            message.message_type = "unsupported";

            const parsedMessage = createParsedMessage({
                messageType: "unsupported",
                submissionType: "unsupported" as ProtocolSubmissionType
            });

            await expect(service.prepareForSubmission(message, parsedMessage)).rejects.toThrow("Unsupported message type: unsupported");
        });

        it("should throw error for unknown creditor agent", async () => {
            (config.get as any).mockReturnValue({});

            const message = new Message();
            message.protocol_submission_type = ProtocolSubmissionType.PACS_008;

            const parsedMessage = createParsedMessage({
                details: {
                    debtorAgent: "TESTBANK",
                    creditorAgent: "UNKNOWN",
                    amount: "100",
                    currency: "USD",
                    messageId: "test-id",
                    creationDate: new Date("2024-01-01T00:00:00Z")
                }
            });

            await expect(service.prepareForSubmission(message, parsedMessage)).rejects.toThrow("No chain mapping found for agent: UNKNOWN");
        });
    });

    describe("prepareForRetry", () => {
        it("should successfully prepare message for retry", async () => {
            (config.get as any).mockReturnValue(3); // maxRetries

            const message = new Message();
            message.id = "test-id";
            message.protocol_submission_type = ProtocolSubmissionType.PACS_008;
            message.transaction_hash = "0x123";
            message.protocol_payload = { originalData: "test" };
            message.processing_metadata = {
                retry_count: 1
            };

            const result = await service.prepareForRetry(message);

            expect(result).toEqual({
                messageType: ProtocolSubmissionType.PACS_008,
                payload: {
                    originalData: "test",
                    retryCount: 2,
                    originalTransactionHash: "0x123"
                },
                targetChain: undefined,
                metadata: {
                    originalMessageId: "test-id",
                    retryTimestamp: expect.any(String),
                    previousTransactionHash: "0x123",
                    retryCount: 2
                },
                options: {
                    urgent: false
                }
            });
        });

        it("should throw error when max retries exceeded", async () => {
            (config.get as any).mockReturnValue(3); // maxRetries

            const message = new Message();
            message.processing_metadata = {
                retry_count: 3
            };

            await expect(service.prepareForRetry(message)).rejects.toThrow("Message cannot be retried");
        });

        it("should handle first retry attempt", async () => {
            (config.get as any).mockReturnValue(3); // maxRetries

            const message = new Message();
            message.id = "test-id";
            message.protocol_submission_type = ProtocolSubmissionType.PACS_008;
            message.protocol_payload = { originalData: "test" };
            // No retry_count in metadata (first retry)

            const result = await service.prepareForRetry(message);

            expect(result.metadata.retryCount).toBe(1);
            expect(result.payload.retryCount).toBe(1);
        });
    });

    describe("Error Handling", () => {
        it("should log errors during submission preparation", async () => {
            const error = new Error("Test error");
            (config.get as any).mockImplementation(() => {
                throw error;
            });

            const message = new Message();
            const parsedMessage = createParsedMessage();

            await expect(service.prepareForSubmission(message, parsedMessage)).rejects.toThrow(error);
            expect(logger.error).toHaveBeenCalledWith("Failed to prepare message for submission", { error });
        });

        it("should log errors during retry preparation", async () => {
            const error = new Error("Test error");
            (config.get as any).mockImplementation(() => {
                throw error;
            });

            const message = new Message();

            await expect(service.prepareForRetry(message)).rejects.toThrow(error);
            expect(logger.error).toHaveBeenCalledWith("Failed to prepare message retry", { error });
        });
    });

    describe("Payload Building", () => {
        it("should build PACS.009 payload correctly", async () => {
            (config.get as any).mockReturnValue({ TESTBANK: 1 });

            const message = new Message();
            message.protocol_submission_type = ProtocolSubmissionType.PACS_009;
            message.message_type = "pacs.009";

            const parsedMessage = createParsedMessage({
                messageType: "pacs.009",
                submissionType: ProtocolSubmissionType.PACS_009,
                details: {
                    debtorAgent: "TESTBANK",
                    creditorAgent: "TESTBANK",
                    amount: "200",
                    currency: "EUR",
                    messageId: "pacs009-msg-id",
                    creationDate: new Date("2024-01-01T00:00:00Z")
                }
            });

            const result = await service.prepareForSubmission(message, parsedMessage);

            expect(result.payload).toEqual({
                debtorAgent: "TESTBANK",
                creditorAgent: "TESTBANK",
                amount: "200",
                currency: "EUR",
                instructionId: "pacs009-msg-id"
            });
        });

        it("should handle different data structures in message payloads", async () => {
            (config.get as any).mockReturnValue({ TESTBANK: 1 });

            const message = new Message();
            message.protocol_submission_type = ProtocolSubmissionType.PACS_008;
            message.message_type = "pacs.008";

            const parsedMessage = createParsedMessage({
                details: {
                    debtorAgent: "TESTBANK",
                    creditorAgent: "TESTBANK",
                    amount: "100",
                    currency: "USD",
                    messageId: "test-id",
                    creationDate: new Date("2024-01-01T00:00:00Z"),
                    additionalField: "test"
                }
            });

            const result = await service.prepareForSubmission(message, parsedMessage);

            expect(result.payload).toEqual({
                debtorAgent: "TESTBANK",
                creditorAgent: "TESTBANK",
                amount: "100",
                currency: "USD",
                instructionId: "test-id"
            });
        });
    });
});
