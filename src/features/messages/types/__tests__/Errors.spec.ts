// src/features/messages/errors/__tests__/errors.spec.ts

import { describe, expect, it } from "vitest";

import {
    EventProcessingError,
    ISO20022ValidationError,
    MessageError,
    MessageProcessingError,
    MessageTrackingError,
    ProtocolSubmissionError,
    ValidationError
} from "../Errors.js";

describe("Message Errors", () => {
    describe("MessageError", () => {
        it("should create base error with message", () => {
            const error = new MessageError("Test error");
            expect(error.message).toBe("Test error");
            expect(error.name).toBe("MessageError");
            expect(error instanceof Error).toBe(true);
        });

        it("should handle cause error", () => {
            const cause = new Error("Cause error");
            const error = new MessageError("Test error", cause);
            expect(error.cause).toBe(cause);
        });
    });

    describe("ISO20022ValidationError", () => {
        it("should create validation error with message", () => {
            const error = new ISO20022ValidationError("Validation failed");
            expect(error.message).toBe("Validation failed");
            expect(error.name).toBe("ISO20022ValidationError");
            expect(error instanceof MessageError).toBe(true);
        });

        it("should handle validation errors array", () => {
            const validationErrors = [
                { code: "001", message: "Invalid field" },
                { code: "002", message: "Missing field" }
            ];
            const error = new ISO20022ValidationError("Validation failed", validationErrors);
            expect(error.errors).toBe(validationErrors);
        });

        it("should handle error object as errors", () => {
            const cause = new Error("Parse error");
            const error = new ISO20022ValidationError("Validation failed", cause);
            expect(error.errors).toBe(cause);
        });
    });

    describe("ProtocolSubmissionError", () => {
        it("should create submission error with message", () => {
            const error = new ProtocolSubmissionError("Submission failed");
            expect(error.message).toBe("Submission failed");
            expect(error.name).toBe("ProtocolSubmissionError");
            expect(error instanceof MessageError).toBe(true);
        });

        it("should handle cause error", () => {
            const cause = new Error("Network error");
            const error = new ProtocolSubmissionError("Submission failed", cause);
            expect(error.cause).toBe(cause);
        });
    });

    describe("ValidationError", () => {
        it("should create validation error with message", () => {
            const error = new ValidationError("Invalid data");
            expect(error.message).toBe("Invalid data");
            expect(error.name).toBe("ValidationError");
            expect(error instanceof MessageError).toBe(true);
        });

        it("should handle validation errors", () => {
            const validationErrors = [
                { field: "amount", message: "Invalid amount" },
                { field: "currency", message: "Invalid currency" }
            ];
            const error = new ValidationError("Invalid data", validationErrors);
            expect(error.validationErrors).toBe(validationErrors);
        });
    });

    describe("MessageProcessingError", () => {
        it("should create processing error with message", () => {
            const error = new MessageProcessingError("Processing failed");
            expect(error.message).toBe("Processing failed");
            expect(error.name).toBe("MessageProcessingError");
            expect(error instanceof MessageError).toBe(true);
        });

        it("should handle error details", () => {
            const details = { step: "validation", reason: "timeout" };
            const error = new MessageProcessingError("Processing failed", details);
            expect(error.details).toBe(details);
        });
    });

    describe("MessageTrackingError", () => {
        it("should create tracking error with message and messageId", () => {
            const error = new MessageTrackingError("Tracking failed", "msg-123");
            expect(error.message).toBe("Tracking failed");
            expect(error.messageId).toBe("msg-123");
            expect(error.name).toBe("MessageTrackingError");
            expect(error instanceof MessageError).toBe(true);
        });

        it("should handle cause error", () => {
            const cause = new Error("Database error");
            const error = new MessageTrackingError("Tracking failed", "msg-123", cause);
            expect(error.cause).toBe(cause);
        });
    });

    describe("EventProcessingError", () => {
        it("should create event processing error with message and event type", () => {
            const error = new EventProcessingError("Event processing failed", "MESSAGE_CREATED");
            expect(error.message).toBe("Event processing failed");
            expect(error.eventType).toBe("MESSAGE_CREATED");
            expect(error.name).toBe("EventProcessingError");
            expect(error instanceof MessageError).toBe(true);
        });

        it("should handle cause error", () => {
            const cause = new Error("Event handler error");
            const error = new EventProcessingError("Event processing failed", "MESSAGE_CREATED", cause);
            expect(error.cause).toBe(cause);
        });
    });
});
