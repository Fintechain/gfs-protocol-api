// src/features/messages/services/__tests__/ProtocolEventService.spec.ts

import { PlatformTest } from "@tsed/platform-http/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LoggerService } from "../../../utils/services/LoggerService.js";
import { MetricsService } from "../../../utils/services/MetricsService.js";
import { Message, MessageStatus } from "../../models/Message.js";
import { EventProcessingError } from "../../types/Errors.js";
import { ProtocolEventService } from "../ProtocolEventService.js";

// Test class that extends ProtocolEventService but skips event initialization
class TestProtocolEventService extends ProtocolEventService {
    constructor(logger: LoggerService, metrics: MetricsService, eventEmitter: any, protocolCoordinator: any, repository: any) {
        super(logger, metrics, eventEmitter, protocolCoordinator, repository);
    }

    // Skip event initialization
    protected initializeEventListeners(): void {
        // Do nothing
    }

    // Expose protected methods for testing
    public async testHandleMessageSubmitted(messageId: string, sender: string, event: any): Promise<void> {
        return this.handleMessageSubmitted(messageId, sender, event);
    }

    public async testHandleMessageStatusUpdated(messageId: string, status: string, event: any): Promise<void> {
        return this.handleMessageStatusUpdated(messageId, status, event);
    }

    public async testHandleSettlementCompleted(messageId: string, settlementId: string, event: any): Promise<void> {
        return this.handleSettlementCompleted(messageId, settlementId, event);
    }
}

describe("ProtocolEventService", () => {
    let service: TestProtocolEventService;
    let logger: LoggerService;
    let metrics: MetricsService;
    let eventEmitter: any;
    let protocolCoordinator: any;
    let repository: any;

    const mockMessage = new Message();
    mockMessage.id = "test-id";
    mockMessage.protocol_message_id = "protocol-msg-id";
    mockMessage.status = MessageStatus.SUBMITTING;

    beforeEach(async () => {
        // Create mock logger
        logger = {
            error: vi.fn(),
            warn: vi.fn(),
            info: vi.fn(),
            debug: vi.fn(),
            child: vi.fn().mockReturnThis()
        } as unknown as LoggerService;

        // Create mock metrics service
        metrics = {
            incrementCounter: vi.fn(),
            createCounter: vi.fn()
        } as unknown as MetricsService;

        // Create mock event emitter
        eventEmitter = {
            emit: vi.fn().mockResolvedValue(undefined)
        };

        // Create mock protocol coordinator contract
        protocolCoordinator = {
            on: vi.fn(),
            removeAllListeners: vi.fn()
        };

        // Create mock repository
        repository = {
            findOne: vi.fn(),
            save: vi.fn()
        };

        // Create test service instance
        service = new TestProtocolEventService(logger, metrics, eventEmitter, protocolCoordinator, repository);

        // Reset all mocks
        vi.clearAllMocks();
    });

    describe("Event Handlers", () => {
        describe("handleMessageSubmitted", () => {
            it("should process message submission event successfully", async () => {
                const event = {
                    blockNumber: 12345,
                    transactionHash: "0x123..."
                };

                repository.findOne.mockResolvedValue(mockMessage);
                repository.save.mockResolvedValue(mockMessage);

                // Call the handler directly using test method
                await service.testHandleMessageSubmitted("protocol-msg-id", "sender", event);

                // Verify message update
                expect(mockMessage.status).toBe(MessageStatus.PENDING);
                expect(mockMessage.block_number).toBe("12345");
                expect(repository.save).toHaveBeenCalledWith(
                    Message,
                    expect.objectContaining({
                        status: MessageStatus.PENDING
                    })
                );

                // Verify event emission
                expect(eventEmitter.emit).toHaveBeenCalledWith(
                    "message.submitted",
                    expect.objectContaining({
                        messageId: mockMessage.id,
                        protocolMessageId: "protocol-msg-id"
                    })
                );

                // Verify metrics
                expect(metrics.incrementCounter).toHaveBeenCalledWith("protocol_events", { type: "message_submitted" });
            });

            it("should handle message not found error", async () => {
                repository.findOne.mockResolvedValue(null);

                const event = {
                    blockNumber: 12345,
                    transactionHash: "0x123..."
                };

                try {
                    await service.testHandleMessageSubmitted("protocol-msg-id", "sender", event);
                    // If we reach here, the test should fail because an error should have been thrown
                    expect(true).toBe(false); // This line shouldn't be reached
                } catch (error) {
                    expect(error).toBeInstanceOf(EventProcessingError);
                    expect(error.message).toBe("Failed to process MessageSubmitted event");
                    const originalError = error.cause as Error;
                    expect(originalError.message).toBe("Message not found for submission event");
                }
            });
        });

        describe("handleMessageStatusUpdated", () => {
            it("should process status update event successfully", async () => {
                const event = {
                    blockNumber: 12345
                };

                repository.findOne.mockResolvedValue(mockMessage);
                repository.save.mockResolvedValue(mockMessage);

                await service.testHandleMessageStatusUpdated("protocol-msg-id", "COMPLETED", event);

                expect(mockMessage.status).toBe(MessageStatus.COMPLETED);
                expect(repository.save).toHaveBeenCalledWith(
                    Message,
                    expect.objectContaining({
                        status: MessageStatus.COMPLETED
                    })
                );

                expect(eventEmitter.emit).toHaveBeenCalledWith(
                    "message.status_updated",
                    expect.objectContaining({
                        messageId: mockMessage.id,
                        protocolMessageId: "protocol-msg-id",
                        status: MessageStatus.COMPLETED
                    })
                );
            });

            it("should handle unknown protocol status", async () => {
                const event = {
                    blockNumber: 12345
                };

                repository.findOne.mockResolvedValue(mockMessage);
                repository.save.mockResolvedValue(mockMessage);

                await service.testHandleMessageStatusUpdated("protocol-msg-id", "UNKNOWN_STATUS", event);

                expect(mockMessage.status).toBe(MessageStatus.FAILED);
                expect(repository.save).toHaveBeenCalledWith(
                    Message,
                    expect.objectContaining({
                        status: MessageStatus.FAILED
                    })
                );
            });
        });

        describe("handleSettlementCompleted", () => {
            it("should process settlement completion event successfully", async () => {
                const event = {
                    blockNumber: 12345
                };

                repository.findOne.mockResolvedValue(mockMessage);
                repository.save.mockResolvedValue(mockMessage);

                await service.testHandleSettlementCompleted("protocol-msg-id", "settlement-123", event);

                expect(mockMessage.status).toBe(MessageStatus.SETTLED);
                expect(mockMessage.settlement_id).toBe("settlement-123");
                expect(repository.save).toHaveBeenCalledWith(
                    Message,
                    expect.objectContaining({
                        status: MessageStatus.SETTLED,
                        settlement_id: "settlement-123"
                    })
                );

                expect(eventEmitter.emit).toHaveBeenCalledWith(
                    "message.settled",
                    expect.objectContaining({
                        messageId: mockMessage.id,
                        protocolMessageId: "protocol-msg-id",
                        settlementId: "settlement-123"
                    })
                );
            });
        });
    });

    describe("Error Handling", () => {
        it("should handle database errors properly", async () => {
            const dbError = new Error("Database error");
            repository.findOne.mockRejectedValue(dbError);

            const event = { blockNumber: 12345 };

            await expect(service.testHandleMessageSubmitted("protocol-msg-id", "sender", event)).rejects.toThrow(EventProcessingError);
        });

        it("should handle event emission errors", async () => {
            repository.findOne.mockResolvedValue(mockMessage);
            repository.save.mockResolvedValue(mockMessage);
            eventEmitter.emit.mockRejectedValue(new Error("Event emission failed"));

            const event = { blockNumber: 12345 };

            await expect(service.testHandleMessageSubmitted("protocol-msg-id", "sender", event)).rejects.toThrow(EventProcessingError);
        });
    });

    describe("Status Mapping", () => {
        it("should map protocol statuses to message statuses correctly", async () => {
            repository.findOne.mockResolvedValue(mockMessage);
            repository.save.mockResolvedValue(mockMessage);

            const event = { blockNumber: 12345 };
            const statusMappings = [
                ["PENDING", MessageStatus.PENDING],
                ["PROCESSING", MessageStatus.PROCESSING],
                ["COMPLETED", MessageStatus.COMPLETED],
                ["FAILED", MessageStatus.FAILED],
                ["REJECTED", MessageStatus.REJECTED],
                ["UNKNOWN", MessageStatus.FAILED]
            ];

            for (const [protocolStatus, expectedStatus] of statusMappings) {
                await service.testHandleMessageStatusUpdated("protocol-msg-id", protocolStatus, event);
                expect(mockMessage.status).toBe(expectedStatus);
            }
        });
    });
});
