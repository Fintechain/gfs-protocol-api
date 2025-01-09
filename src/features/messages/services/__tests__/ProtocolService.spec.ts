// src/features/messages/services/__tests__/ProtocolService.spec.ts

import { beforeEach, describe, expect, it, Mock, vi } from "vitest";

import { CacheService } from "../../../utils/services/CacheService.js";
import { ConfigService } from "../../../utils/services/ConfigService.js";
import { LoggerService } from "../../../utils/services/LoggerService.js";
import { MetricsService } from "../../../utils/services/MetricsService.js";
import { Message, MessageStatus, ProtocolSubmissionType } from "../../models/Message.js";
import { ProtocolSubmissionError, ValidationError } from "../../types/Errors.js";
import { ParsedMessage } from "../../types/Messages.js";
import { ProtocolService } from "../ProtocolService.js";

type MockedAsyncFunction<T extends (...args: any) => Promise<any>> = Mock;

describe("ProtocolService", () => {
    let service: ProtocolService;
    let logger: LoggerService;
    let config: ConfigService;
    let cache: CacheService;
    let metrics: MetricsService;
    let iso20022Service: { parseMessage: Mock };
    let preprocessor: { prepareForSubmission: Mock; prepareForRetry: Mock };
    let protocolCoordinator: any;
    let repository: any;

    // Create a message factory to ensure proper class methods
    const createMessage = () => {
        const message = new Message();
        message.id = "test-id";
        message.protocol_message_id = "protocol-msg-id";
        message.status = MessageStatus.DRAFT;
        message.protocol_submission_type = ProtocolSubmissionType.PACS_008;
        message.processing_metadata = { retry_count: 0, processing_steps: [] };
        message.updated_at = new Date("2024-01-01");
        return message;
    };

    const mockContractTransaction = {
        hash: "0x123",
        wait: vi.fn().mockResolvedValue({
            blockNumber: 12345,
            blockTimestamp: new Date("2024-01-01")
        })
    };

    beforeEach(async () => {
        logger = {
            error: vi.fn(),
            warn: vi.fn(),
            info: vi.fn(),
            debug: vi.fn(),
            child: vi.fn().mockReturnThis()
        } as unknown as LoggerService;

        config = { get: vi.fn() } as unknown as ConfigService;
        cache = { get: vi.fn(), set: vi.fn() } as unknown as CacheService;
        metrics = {
            incrementCounter: vi.fn(),
            observeHistogram: vi.fn()
        } as unknown as MetricsService;

        iso20022Service = { parseMessage: vi.fn() };
        preprocessor = {
            prepareForSubmission: vi.fn(),
            prepareForRetry: vi.fn()
        };

        protocolCoordinator = {
            submitMessage: vi.fn(),
            retryMessage: vi.fn(),
            getMessageResult: vi.fn(),
            quoteMessageFee: vi.fn()
        };

        // Repository that preserves Message class methods
        repository = {
            save: vi.fn().mockImplementation((entity) => {
                /*  if (entity instanceof Message) {
                    return Promise.resolve(entity);
                } */
                const message = createMessage();
                //Object.assign(message);
                return Promise.resolve(message);
            }),
            findOne: vi.fn(),
            findOneOrFail: vi.fn()
        };

        service = new ProtocolService(logger, config, cache, metrics, iso20022Service as any, preprocessor as any, repository);

        (service as any).protocolCoordinator = protocolCoordinator;

        vi.clearAllMocks();
    });

    describe("submitMessage", () => {
        const mockParsedMessage: ParsedMessage = {
            messageType: "pacs.008",
            submissionType: ProtocolSubmissionType.PACS_008,
            originalXml: "<xml>test</xml>",
            parsedData: { test: "data" },
            details: {
                messageId: "test-id",
                creationDate: new Date(),
                amount: "100",
                currency: "USD",
                debtorAgent: "TESTBANK",
                creditorAgent: "TESTBANK"
            }
        };

        const mockSubmissionData = {
            messageType: ProtocolSubmissionType.PACS_008,
            target: "0x1234",
            targetChain: 1,
            payload: "0x5678"
        };

        beforeEach(() => {
            iso20022Service.parseMessage.mockResolvedValue(mockParsedMessage);
            preprocessor.prepareForSubmission.mockResolvedValue(mockSubmissionData);
            protocolCoordinator.quoteMessageFee.mockResolvedValue({ _baseFee: 1000n, _deliveryFee: 500n });
            protocolCoordinator.submitMessage.mockResolvedValue(mockContractTransaction);
        });

        it("should submit message successfully", async () => {
            const result = await service.submitMessage("<xml>test</xml>");

            expect(result).toEqual({
                messageId: "test-id",
                protocolMessageId: "0x123",
                status: MessageStatus.PENDING
            });

            expect(iso20022Service.parseMessage).toHaveBeenCalledWith("<xml>test</xml>");
            expect(preprocessor.prepareForSubmission).toHaveBeenCalled();
            expect(protocolCoordinator.submitMessage).toHaveBeenCalled();
            expect(metrics.incrementCounter).toHaveBeenCalledWith("protocol_submissions_total", { result: "success" });
        });

        it("should handle empty input", async () => {
            await expect(service.submitMessage("")).rejects.toThrow(ValidationError);
            expect(iso20022Service.parseMessage).not.toHaveBeenCalled();
        });

        it("should handle parsing errors", async () => {
            iso20022Service.parseMessage.mockRejectedValue(new Error("Parse error"));
            await expect(service.submitMessage("<xml>test</xml>")).rejects.toThrow(ProtocolSubmissionError);
            expect(metrics.incrementCounter).toHaveBeenCalledWith("protocol_submissions_total", { result: "failure" });
        });

        it("should handle fee quote errors", async () => {
            protocolCoordinator.quoteMessageFee.mockRejectedValue(new Error("Fee quote failed"));
            await expect(service.submitMessage("<xml>test</xml>")).rejects.toThrow(ProtocolSubmissionError);
        });

        it("should handle transaction confirmation failure", async () => {
            mockContractTransaction.wait.mockRejectedValue(new Error("Transaction failed"));
            await service.submitMessage("<xml>test</xml>");

            const lastSaveCall = repository.save.mock.calls[repository.save.mock.calls.length - 1];
            expect(lastSaveCall[0]).toBeInstanceOf(Message);
            expect(lastSaveCall[0].status).toBe(MessageStatus.FAILED);
            expect(lastSaveCall[0].processing_metadata?.processing_steps).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        step: "submission",
                        status: "failed"
                    })
                ])
            );
        });
    });

    describe("retryMessage", () => {
        beforeEach(() => {
            const mockMessage = createMessage();
            mockMessage.status = MessageStatus.FAILED;
            repository.findOneOrFail.mockResolvedValue(mockMessage);
            protocolCoordinator.retryMessage.mockResolvedValue(mockContractTransaction);
        });

        it("should retry message successfully", async () => {
            const result = await service.retryMessage("test-id");

            expect(result).toEqual({
                messageId: "test-id",
                newTransactionHash: "0x123",
                status: MessageStatus.PENDING
            });
        });

        it("should validate retry eligibility", async () => {
            const mockMessage = createMessage();
            mockMessage.status = MessageStatus.COMPLETED;
            repository.findOneOrFail.mockResolvedValue(mockMessage);

            await expect(service.retryMessage("test-id")).rejects.toThrow(ValidationError);
        });

        it("should enforce retry limit", async () => {
            const mockMessage = createMessage();
            mockMessage.status = MessageStatus.FAILED;
            mockMessage.processing_metadata = { retry_count: 3 };
            repository.findOneOrFail.mockResolvedValue(mockMessage);

            await expect(service.retryMessage("test-id")).rejects.toThrow(ValidationError);
        });
    });

    describe("getMessageStatus", () => {
        beforeEach(() => {
            repository.findOneOrFail.mockResolvedValue(createMessage());
            protocolCoordinator.getMessageResult.mockResolvedValue({
                success: true,
                result: "test-result"
            });
        });

        it("should get message status successfully", async () => {
            const result = await service.getMessageStatus("test-id");

            expect(result).toEqual({
                messageId: "test-id",
                status: MessageStatus.COMPLETED,
                protocolStatus: "Completed",
                settlementStatus: undefined,
                lastUpdated: expect.any(Date),
                details: expect.objectContaining({
                    rawResult: "test-result"
                })
            });
        });

        it("should handle message not found", async () => {
            repository.findOneOrFail.mockRejectedValue(new Error("Not found"));
            await expect(service.getMessageStatus("test-id")).rejects.toThrow();
        });

        it("should handle missing protocol message ID", async () => {
            const messageWithoutProtocolId = createMessage();
            messageWithoutProtocolId.protocol_message_id = null as any;
            repository.findOneOrFail.mockResolvedValue(messageWithoutProtocolId);
            await expect(service.getMessageStatus("test-id")).rejects.toThrow(ValidationError);
        });

        it("should handle protocol query errors", async () => {
            protocolCoordinator.getMessageResult.mockRejectedValue(new Error("Protocol error"));
            await expect(service.getMessageStatus("test-id")).rejects.toThrow();
            expect(logger.error).toHaveBeenCalledWith("Failed to get message status", expect.any(Object));
        });
    });
});
