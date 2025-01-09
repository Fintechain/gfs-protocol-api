// src/features/messages/types/__tests__/Messages.spec.ts

import { describe, expect, it } from "vitest";

import { MessageStatus, ProtocolSubmissionType } from "../../models/Message.js";
import {
    MessageDetails,
    MessageHistory,
    MessageHistoryEvent,
    MessageStatusResult,
    MessageTrackingResult,
    ParsedMessage,
    ProtocolSubmission,
    RetryOptions,
    RetryResult,
    RuleResult,
    SubmitOptions,
    SubmitResult,
    TransactionEvent,
    ValidationResultItem,
    ValidationResults
} from "../Messages.js";

describe("Message Types", () => {
    describe("ParsedMessage", () => {
        it("should validate parsed message structure", () => {
            const message: ParsedMessage = {
                messageType: "pacs.008",
                submissionType: ProtocolSubmissionType.PACS_008,
                originalXml: "<xml>test</xml>",
                parsedData: { test: "data" },
                details: {
                    messageId: "msg-123",
                    creationDate: new Date(),
                    amount: "100",
                    currency: "USD",
                    debtorAgent: "TESTBANK1",
                    creditorAgent: "TESTBANK2"
                }
            };

            expect(message).toEqual(
                expect.objectContaining({
                    messageType: expect.any(String),
                    submissionType: expect.any(String),
                    originalXml: expect.any(String),
                    parsedData: expect.any(Object),
                    details: expect.any(Object)
                })
            );
        });

        it("should allow additional fields in message details", () => {
            const details: MessageDetails = {
                messageId: "msg-123",
                creationDate: new Date(),
                amount: "100",
                currency: "USD",
                debtorAgent: "TESTBANK1",
                creditorAgent: "TESTBANK2",
                extraField: "value",
                customData: { test: true }
            };

            expect(details.extraField).toBe("value");
            expect(details.customData.test).toBe(true);
        });
    });

    describe("Submit and Retry Options", () => {
        it("should validate submit options", () => {
            const options: SubmitOptions = {
                urgent: true,
                maxFee: "0.1",
                metadata: { priority: "high" }
            };

            expect(options).toEqual(
                expect.objectContaining({
                    urgent: expect.any(Boolean),
                    maxFee: expect.any(String),
                    metadata: expect.any(Object)
                })
            );
        });

        it("should validate retry options", () => {
            const options: RetryOptions = {
                maxFee: "0.2",
                urgent: true
            };

            expect(options).toEqual(
                expect.objectContaining({
                    maxFee: expect.any(String),
                    urgent: expect.any(Boolean)
                })
            );
        });
    });

    describe("Submit and Retry Results", () => {
        it("should validate submit result", () => {
            const result: SubmitResult = {
                messageId: "msg-123",
                protocolMessageId: "proto-123",
                status: MessageStatus.PENDING
            };

            expect(result).toEqual(
                expect.objectContaining({
                    messageId: expect.any(String),
                    protocolMessageId: expect.any(String),
                    status: expect.any(String)
                })
            );
        });

        it("should validate retry result", () => {
            const result: RetryResult = {
                messageId: "msg-123",
                newTransactionHash: "0x123...",
                status: MessageStatus.PROCESSING
            };

            expect(result).toEqual(
                expect.objectContaining({
                    messageId: expect.any(String),
                    newTransactionHash: expect.any(String),
                    status: expect.any(String)
                })
            );
        });
    });

    describe("Protocol Submission", () => {
        it("should validate protocol submission structure", () => {
            const submission: ProtocolSubmission = {
                messageType: ProtocolSubmissionType.PACS_008,
                payload: { test: "data" },
                targetChain: 1,
                metadata: { version: "1.0" },
                options: {
                    urgent: false
                }
            };

            expect(submission).toEqual(
                expect.objectContaining({
                    messageType: expect.any(String),
                    payload: expect.any(Object),
                    targetChain: expect.any(Number),
                    metadata: expect.any(Object),
                    options: expect.objectContaining({
                        urgent: expect.any(Boolean)
                    })
                })
            );
        });
    });

    describe("Message Status and Tracking", () => {
        it("should validate message status result", () => {
            const status: MessageStatusResult = {
                messageId: "msg-123",
                status: MessageStatus.PROCESSING,
                protocolStatus: "PENDING",
                settlementStatus: "IN_PROGRESS",
                lastUpdated: new Date(),
                details: { step: "validation" }
            };

            expect(status).toEqual(
                expect.objectContaining({
                    messageId: expect.any(String),
                    status: expect.any(String),
                    protocolStatus: expect.any(String),
                    lastUpdated: expect.any(Date),
                    details: expect.any(Object)
                })
            );
        });

        it("should validate message tracking result", () => {
            const tracking: MessageTrackingResult = {
                messageId: "msg-123",
                status: MessageStatus.PROCESSING,
                details: {
                    protocolMessageId: "proto-123",
                    transactionHash: "0x123...",
                    blockNumber: "12345",
                    blockTimestamp: new Date(),
                    settlementId: "settlement-123",
                    protocolStatus: "PENDING",
                    settlementStatus: "IN_PROGRESS"
                },
                lastUpdated: new Date()
            };

            expect(tracking).toEqual(
                expect.objectContaining({
                    messageId: expect.any(String),
                    status: expect.any(String),
                    details: expect.any(Object),
                    lastUpdated: expect.any(Date)
                })
            );
        });
    });

    describe("Message History", () => {
        it("should validate message history structure", () => {
            const historyEvent: MessageHistoryEvent = {
                type: "STATUS_CHANGED",
                timestamp: new Date(),
                details: { from: "DRAFT", to: "PROCESSING" }
            };

            const transactionEvent: TransactionEvent = {
                type: "SUBMITTED",
                transactionHash: "0x123...",
                blockNumber: "12345",
                timestamp: new Date()
            };

            const history: MessageHistory = {
                messageId: "msg-123",
                currentStatus: MessageStatus.PROCESSING,
                events: [historyEvent],
                processingSteps: [
                    {
                        step: "validation",
                        timestamp: new Date(),
                        status: "completed",
                        details: { duration: 100 }
                    }
                ],
                validations: [
                    {
                        timestamp: new Date(),
                        type: "schema",
                        result: "passed",
                        details: { rules: ["R1", "R2"] }
                    }
                ],
                transactions: [transactionEvent]
            };

            expect(history).toEqual(
                expect.objectContaining({
                    messageId: expect.any(String),
                    currentStatus: expect.any(String),
                    events: expect.arrayContaining([expect.any(Object)]),
                    processingSteps: expect.arrayContaining([expect.any(Object)]),
                    validations: expect.arrayContaining([expect.any(Object)]),
                    transactions: expect.arrayContaining([expect.any(Object)])
                })
            );
        });
    });

    describe("Validation Results", () => {
        it("should validate validation results structure", () => {
            const ruleResult: RuleResult = {
                valid: true,
                code: "R1",
                message: "Validation passed"
            };

            const validationResultItem: ValidationResultItem = {
                type: "schema",
                isValid: true,
                validationErrors: [],
                details: { rules: [ruleResult] }
            };

            const results: ValidationResults = {
                isValid: true,
                validations: [validationResultItem],
                timestamp: new Date()
            };

            // Check overall results structure
            expect(results).toEqual(
                expect.objectContaining({
                    isValid: expect.any(Boolean),
                    validations: expect.arrayContaining([expect.any(Object)]),
                    timestamp: expect.any(Date)
                })
            );

            // Check validation item structure
            expect(validationResultItem).toEqual(
                expect.objectContaining({
                    type: expect.any(String),
                    isValid: expect.any(Boolean),
                    validationErrors: expect.any(Array),
                    details: expect.any(Object)
                })
            );

            // Check rule result structure
            expect(ruleResult).toEqual(
                expect.objectContaining({
                    valid: expect.any(Boolean),
                    code: expect.any(String),
                    message: expect.any(String)
                })
            );
        });
    });
});
