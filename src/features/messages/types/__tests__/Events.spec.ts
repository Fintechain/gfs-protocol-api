// src/features/messages/types/__tests__/Events.spec.ts

import { describe, expect, it } from "vitest";

import { Message, MessageStatus, ProtocolSubmissionType } from "../../models/Message.js";
import { MessageCreatedEvent, MessageFailedEvent, MessageSubmittedEvent } from "../Events.js";

describe("Message Events", () => {
    // Helper to create a test message
    const createTestMessage = (): Message => {
        const message = new Message();
        message.id = "test-id";
        message.message_type = "pacs.008";
        message.protocol_submission_type = ProtocolSubmissionType.PACS_008;
        message.status = MessageStatus.DRAFT;
        return message;
    };

    describe("MessageCreatedEvent", () => {
        it("should properly structure message created event", () => {
            const message = createTestMessage();
            const timestamp = new Date();

            const event: MessageCreatedEvent = {
                type: "MESSAGE_CREATED",
                messageId: message.id,
                timestamp,
                message
            };

            expect(event.type).toBe("MESSAGE_CREATED");
            expect(event.messageId).toBe(message.id);
            expect(event.timestamp).toBe(timestamp);
            expect(event.message).toBe(message);
        });
    });

    describe("MessageSubmittedEvent", () => {
        it("should properly structure message submitted event", () => {
            const message = createTestMessage();
            const timestamp = new Date();
            const transactionHash = "0x123...";

            const event: MessageSubmittedEvent = {
                type: "MESSAGE_SUBMITTED",
                messageId: message.id,
                timestamp,
                message,
                transactionHash
            };

            expect(event.type).toBe("MESSAGE_SUBMITTED");
            expect(event.messageId).toBe(message.id);
            expect(event.timestamp).toBe(timestamp);
            expect(event.message).toBe(message);
            expect(event.transactionHash).toBe(transactionHash);
        });
    });

    describe("MessageFailedEvent", () => {
        it("should properly structure message failed event", () => {
            const message = createTestMessage();
            const timestamp = new Date();
            const error = new Error("Processing failed");

            const event: MessageFailedEvent = {
                type: "MESSAGE_FAILED",
                messageId: message.id,
                timestamp,
                message,
                error
            };

            expect(event.type).toBe("MESSAGE_FAILED");
            expect(event.messageId).toBe(message.id);
            expect(event.timestamp).toBe(timestamp);
            expect(event.message).toBe(message);
            expect(event.error).toBe(error);
        });

        it("should handle different types of errors", () => {
            const message = createTestMessage();
            const timestamp = new Date();

            // Test with custom error
            const customError = new Error("Custom error");
            customError.name = "CustomError";

            const event: MessageFailedEvent = {
                type: "MESSAGE_FAILED",
                messageId: message.id,
                timestamp,
                message,
                error: customError
            };

            expect(event.error.name).toBe("CustomError");
        });
    });

    describe("Event Type Safety", () => {
        it("should enforce required properties for all events", () => {
            const message = createTestMessage();
            const timestamp = new Date();

            // Test type safety for MessageCreatedEvent
            const createdEvent: MessageCreatedEvent = {
                type: "MESSAGE_CREATED",
                messageId: message.id,
                timestamp,
                message
            };
            expect(createdEvent).toBeDefined();

            // Test type safety for MessageSubmittedEvent
            const submittedEvent: MessageSubmittedEvent = {
                type: "MESSAGE_SUBMITTED",
                messageId: message.id,
                timestamp,
                message,
                transactionHash: "0x123..."
            };
            expect(submittedEvent).toBeDefined();

            // Test type safety for MessageFailedEvent
            const failedEvent: MessageFailedEvent = {
                type: "MESSAGE_FAILED",
                messageId: message.id,
                timestamp,
                message,
                error: new Error("Test error")
            };
            expect(failedEvent).toBeDefined();
        });
    });

    describe("Event Properties", () => {
        it("should ensure all events have common base properties", () => {
            const message = createTestMessage();
            const timestamp = new Date();
            const baseProperties = ["type", "messageId", "timestamp"];

            // Check MessageCreatedEvent
            const createdEvent: MessageCreatedEvent = {
                type: "MESSAGE_CREATED",
                messageId: message.id,
                timestamp,
                message
            };
            baseProperties.forEach((prop) => {
                expect(createdEvent).toHaveProperty(prop);
            });

            // Check MessageSubmittedEvent
            const submittedEvent: MessageSubmittedEvent = {
                type: "MESSAGE_SUBMITTED",
                messageId: message.id,
                timestamp,
                message,
                transactionHash: "0x123..."
            };
            baseProperties.forEach((prop) => {
                expect(submittedEvent).toHaveProperty(prop);
            });

            // Check MessageFailedEvent
            const failedEvent: MessageFailedEvent = {
                type: "MESSAGE_FAILED",
                messageId: message.id,
                timestamp,
                message,
                error: new Error("Test error")
            };
            baseProperties.forEach((prop) => {
                expect(failedEvent).toHaveProperty(prop);
            });
        });
    });
});
