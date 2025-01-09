// src/features/messages/services/__tests__/MessageTrackingService.spec.ts

import { PlatformTest } from "@tsed/platform-http/testing";
import { beforeEach, describe, expect, it, Mock, vi } from "vitest";

import { CacheService } from "../../../utils/services/CacheService.js";
import { LoggerService } from "../../../utils/services/LoggerService.js";
import { Message, MessageStatus } from "../../models/Message.js";
import { MessageValidation, ValidationResult } from "../../models/MessageValidation.js";
import { MessageTrackingError } from "../../types/Errors.js";
import { MessageTrackingService } from "../MessageTrackingService.js";

// Define mock types that include Vitest mock methods
type MockedAsyncFunction<T extends (...args: any) => Promise<any>> = Mock;

describe("MessageTrackingService", () => {
    let service: MessageTrackingService;
    let logger: LoggerService;
    let cache: CacheService;
    let protocolCoordinator: any;
    let repository: any;

    const mockValidation = new MessageValidation();
    mockValidation.id = "validation-id";
    mockValidation.validation_type = "schema";
    mockValidation.result = ValidationResult.PASSED;
    mockValidation.details = {};
    mockValidation.version = 1;
    mockValidation.message_id = "test-id";
    mockValidation.performed_by = "user-id";
    mockValidation.created_at = new Date("2024-01-01");

    const mockMessage = new Message();
    mockMessage.id = "test-id";
    mockMessage.protocol_message_id = "protocol-msg-id";
    mockMessage.status = MessageStatus.PENDING;
    mockMessage.transaction_hash = "0x123";
    mockMessage.block_number = "12345";
    mockMessage.block_timestamp = new Date("2024-01-01");
    mockMessage.settlement_id = "settlement-123";
    mockMessage.created_at = new Date("2024-01-01");
    mockMessage.updated_at = new Date("2024-01-02");
    mockMessage.processing_metadata = {
        processing_steps: [
            {
                step: "submission",
                timestamp: new Date("2024-01-01T00:00:00Z"),
                status: "completed", // Added required status field
                details: { blockNumber: 12345 }
            }
        ],
        retry_count: 0
    };
    mockMessage.validations = [mockValidation];

    beforeEach(async () => {
        // Create mock logger
        logger = {
            error: vi.fn(),
            warn: vi.fn(),
            info: vi.fn(),
            debug: vi.fn(),
            child: vi.fn().mockReturnThis()
        } as unknown as LoggerService;

        // Create properly typed mock cache service
        cache = {
            get: vi.fn(),
            set: vi.fn()
        } as unknown as CacheService;

        // Create mock protocol coordinator contract
        protocolCoordinator = {
            getMessageResult: vi.fn()
        };

        // Create mock repository
        repository = {
            findOne: vi.fn()
        };

        // Create service instance
        service = new MessageTrackingService(logger, cache, protocolCoordinator, repository);

        // Reset all mocks
        vi.clearAllMocks();
    });

    describe("trackMessage", () => {
        it("should return cached status if available", async () => {
            const cachedStatus = {
                messageId: "test-id",
                status: MessageStatus.PENDING,
                details: {},
                lastUpdated: new Date()
            };

            (cache.get as MockedAsyncFunction<typeof cache.get>).mockResolvedValue(cachedStatus);

            const result = await service.trackMessage("test-id");

            expect(result).toEqual(cachedStatus);
            expect(cache.get).toHaveBeenCalledWith("message-status:test-id");
            expect(repository.findOne).not.toHaveBeenCalled();
        });

        it("should track message status successfully", async () => {
            (cache.get as MockedAsyncFunction<typeof cache.get>).mockResolvedValue(null);
            repository.findOne.mockResolvedValue(mockMessage);
            protocolCoordinator.getMessageResult.mockResolvedValue({
                status: "COMPLETED"
            });

            const result = await service.trackMessage("test-id");

            expect(result).toEqual({
                messageId: "test-id",
                status: MessageStatus.PENDING,
                details: {
                    protocolMessageId: "protocol-msg-id",
                    transactionHash: "0x123",
                    blockNumber: "12345",
                    blockTimestamp: expect.any(Date),
                    settlementId: "settlement-123",
                    protocolStatus: "COMPLETED",
                    settlementStatus: undefined
                },
                lastUpdated: expect.any(Date)
            });

            expect(cache.set).toHaveBeenCalledWith("message-status:test-id", expect.any(Object), { ttl: 60 });
        });

        it("should handle message not found error", async () => {
            (cache.get as MockedAsyncFunction<typeof cache.get>).mockResolvedValue(null);
            repository.findOne.mockResolvedValue(null);

            await expect(service.trackMessage("test-id")).rejects.toThrow(MessageTrackingError);
        });

        it("should handle protocol coordinator errors", async () => {
            (cache.get as MockedAsyncFunction<typeof cache.get>).mockResolvedValue(null);
            repository.findOne.mockResolvedValue(mockMessage);
            protocolCoordinator.getMessageResult.mockRejectedValue(new Error("Protocol error"));

            await expect(service.trackMessage("test-id")).rejects.toThrow(MessageTrackingError);
        });
    });

    describe("getMessageHistory", () => {
        it("should retrieve message history successfully", async () => {
            repository.findOne.mockResolvedValue(mockMessage);

            const result = await service.getMessageHistory("test-id");

            expect(result).toEqual({
                messageId: "test-id",
                currentStatus: MessageStatus.PENDING,
                events: expect.arrayContaining([
                    {
                        type: "created",
                        timestamp: expect.any(Date),
                        details: expect.any(Object)
                    }
                ]),
                processingSteps: expect.arrayContaining([
                    {
                        step: "submission",
                        timestamp: expect.any(Date),
                        status: "completed",
                        details: { blockNumber: 12345 }
                    }
                ]),
                validations: expect.arrayContaining([
                    {
                        timestamp: expect.any(Date),
                        type: "schema",
                        result: ValidationResult.PASSED,
                        details: {}
                    }
                ]),
                transactions: expect.arrayContaining([
                    {
                        type: "submission",
                        transactionHash: "0x123",
                        blockNumber: "12345",
                        timestamp: expect.any(Date)
                    }
                ])
            });
        });

        it("should handle message not found error", async () => {
            repository.findOne.mockResolvedValue(null);

            await expect(service.getMessageHistory("test-id")).rejects.toThrow(MessageTrackingError);
        });

        it("should handle empty processing metadata", async () => {
            const messageWithoutMetadata = { ...mockMessage };
            messageWithoutMetadata.processing_metadata = undefined;
            repository.findOne.mockResolvedValue(messageWithoutMetadata);

            const result = await service.getMessageHistory("test-id");

            expect(result.processingSteps).toEqual([]);
        });

        it("should handle database errors", async () => {
            repository.findOne.mockRejectedValue(new Error("Database error"));

            await expect(service.getMessageHistory("test-id")).rejects.toThrow(MessageTrackingError);
        });
    });

    describe("Error Handling", () => {
        it("should handle cache get errors by throwing MessageTrackingError", async () => {
            const cacheError = new Error("Cache error");
            (cache.get as MockedAsyncFunction<typeof cache.get>).mockRejectedValue(cacheError);
            repository.findOne.mockResolvedValue(mockMessage);

            await expect(service.trackMessage("test-id")).rejects.toThrow(MessageTrackingError);

            expect(logger.error).toHaveBeenCalledWith(
                "Failed to track message",
                expect.objectContaining({
                    messageId: "test-id",
                    error: cacheError
                })
            );
        });

        it("should handle cache set errors by throwing MessageTrackingError", async () => {
            const cacheError = new Error("Cache set error");
            (cache.get as MockedAsyncFunction<typeof cache.get>).mockResolvedValue(null);
            (cache.set as MockedAsyncFunction<typeof cache.set>).mockRejectedValue(cacheError);
            repository.findOne.mockResolvedValue(mockMessage);
            protocolCoordinator.getMessageResult.mockResolvedValue({ status: "COMPLETED" });

            await expect(service.trackMessage("test-id")).rejects.toThrow(MessageTrackingError);

            expect(logger.error).toHaveBeenCalledWith(
                "Failed to track message",
                expect.objectContaining({
                    messageId: "test-id",
                    error: cacheError
                })
            );
        });
    });
});
