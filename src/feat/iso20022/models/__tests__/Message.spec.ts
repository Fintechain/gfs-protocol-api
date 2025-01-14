// src/features/messages/models/__tests__/Message.spec.ts

import { PlatformTest } from "@tsed/platform-http/testing";
import { validate } from "class-validator";
import { beforeEach, describe, expect, it } from "vitest";

import { Message, MessageStatus, ProtocolSubmissionType } from "../Message.js";

describe("Message Entity", () => {
    beforeEach(PlatformTest.create);

    describe("Version Management", () => {
        it("should initialize version on creation", () => {
            const message = new Message();
            expect(message.version).toBeUndefined();

            message.beforeInsert();
            expect(message.version).toBe(1);

            // Should not reinitialize if version exists
            message.version = 5;
            message.beforeInsert();
            expect(message.version).toBe(5);
        });

        it("should increment version on update", () => {
            const message = new Message();
            message.version = 1;

            message.beforeUpdate();
            expect(message.version).toBe(2);

            message.beforeUpdate();
            expect(message.version).toBe(3);
        });
    });

    describe("Validation", () => {
        it("should validate a valid message", async () => {
            const message = new Message();
            message.id = "550e8400-e29b-41d4-a716-446655440000";
            message.message_type = "pacs.008";
            message.protocol_submission_type = ProtocolSubmissionType.PACS_008;
            message.parsed_payload = { amount: 100 };
            message.xml_payload = "<xml>test</xml>";
            message.status = MessageStatus.DRAFT;
            message.institution_id = "550e8400-e29b-41d4-a716-446655440000";
            message.created_by = "550e8400-e29b-41d4-a716-446655440000";

            const errors = await validate(message);
            expect(errors).toHaveLength(0);
        });

        it("should fail validation for missing required fields", async () => {
            const message = new Message();
            const errors = await validate(message);

            const requiredFields = [
                "message_type",
                "parsed_payload",
                "xml_payload",
                "protocol_submission_type",
                "institution_id",
                "created_by",
                "status"
            ];
            const actualFields = errors.map((e) => e.property).filter((p) => requiredFields.includes(p));

            expect(actualFields.sort()).toEqual(requiredFields.sort());
            expect(actualFields).toHaveLength(requiredFields.length);
        });

        it("should fail validation for invalid UUID fields", async () => {
            const message = new Message();
            message.message_type = "pacs.008";
            message.parsed_payload = { amount: 100 };
            message.protocol_submission_type = ProtocolSubmissionType.PACS_008;
            message.xml_payload = "<xml>test</xml>";
            message.status = MessageStatus.DRAFT;
            message.institution_id = "invalid-uuid";
            message.created_by = "invalid-uuid";

            const errors = await validate(message);
            const uuidFields = ["institution_id", "created_by"];
            const uuidErrors = errors.filter((e) => e.constraints?.isUuid && uuidFields.includes(e.property));

            expect(uuidErrors).toHaveLength(2);
            expect(uuidErrors.map((e) => e.property).sort()).toEqual(uuidFields.sort());
        });

        it("should validate optional fields when provided", async () => {
            const message = new Message();
            message.id = "550e8400-e29b-41d4-a716-446655440000";
            message.message_type = "pacs.008";
            message.protocol_submission_type = ProtocolSubmissionType.PACS_008;
            message.parsed_payload = { amount: 100 };
            message.xml_payload = "<xml>test</xml>";
            message.status = MessageStatus.DRAFT;
            message.institution_id = "550e8400-e29b-41d4-a716-446655440000";
            message.created_by = "550e8400-e29b-41d4-a716-446655440000";

            // Add optional fields
            message.protocol_message_id = "MSG123";
            message.transaction_hash = "0x123abc";
            message.target_chain_id = 1;
            message.target_address = "0x1234567890123456789012345678901234567890";
            message.block_number = "12345";
            message.settlement_id = "SETT123";
            message.updated_by = "550e8400-e29b-41d4-a716-446655440000";

            const errors = await validate(message);
            expect(errors).toHaveLength(0);
        });
    });

    describe("Status Management", () => {
        it("should fail validation for invalid status", async () => {
            const message = new Message();
            message.message_type = "pacs.008";
            message.parsed_payload = { amount: 100 };
            message.protocol_submission_type = ProtocolSubmissionType.PACS_008;
            message.xml_payload = "<xml>test</xml>";
            message.status = "invalid" as MessageStatus;
            message.institution_id = "550e8400-e29b-41d4-a716-446655440000";
            message.created_by = "550e8400-e29b-41d4-a716-446655440000";

            const errors = await validate(message);
            const statusErrors = errors.filter((e) => e.property === "status");
            expect(statusErrors).toHaveLength(1);
            expect(statusErrors[0].constraints).toHaveProperty("isEnum");
        });

        it("should allow all valid status values", async () => {
            const message = new Message();
            message.message_type = "pacs.008";
            message.parsed_payload = { amount: 100 };
            message.protocol_submission_type = ProtocolSubmissionType.PACS_008;
            message.xml_payload = "<xml>test</xml>";
            message.institution_id = "550e8400-e29b-41d4-a716-446655440000";
            message.created_by = "550e8400-e29b-41d4-a716-446655440000";

            for (const status of Object.values(MessageStatus)) {
                message.status = status;
                const errors = await validate(message);
                const statusErrors = errors.filter((e) => e.property === "status");
                expect(statusErrors).toHaveLength(0);
            }
        });
    });

    describe("Processing Metadata", () => {
        it("should initialize processing metadata from scratch", () => {
            const message = new Message();
            expect(message.processing_metadata).toBeUndefined();

            message.addProcessingStep("INIT", "SUCCESS");
            expect(message.processing_metadata).toBeDefined();
            expect(message.processing_metadata?.processing_steps).toHaveLength(1);
        });

        it("should initialize processing steps array if metadata exists without steps", () => {
            const message = new Message();
            message.processing_metadata = { retry_count: 0 };

            message.addProcessingStep("INIT", "SUCCESS");
            expect(message.processing_metadata.processing_steps).toHaveLength(1);
        });

        it("should handle processing metadata with existing steps", () => {
            const message = new Message();
            const existingDate = new Date();
            message.processing_metadata = {
                processing_steps: [
                    {
                        step: "EXISTING",
                        status: "DONE",
                        timestamp: existingDate
                    }
                ]
            };

            message.addProcessingStep("NEW", "SUCCESS");

            expect(message.processing_metadata?.processing_steps).toBeDefined();
            const steps = message.processing_metadata?.processing_steps;
            expect(steps).toBeDefined();
            if (!steps) return; // Type guard

            expect(steps.length).toBe(2);
            expect(message.getCurrentProcessingStep()).toBe("NEW");
            expect(steps[0].timestamp).toBe(existingDate);
        });

        it("should include optional details in processing steps", () => {
            const message = new Message();
            const details = { transactionHash: "0x123", blockNumber: 1234 };

            message.addProcessingStep("BLOCKCHAIN", "CONFIRMED", details);

            const step = message.processing_metadata?.processing_steps?.[0];
            expect(step?.details).toEqual(details);
        });

        it("should handle null processing metadata scenarios", () => {
            const message = new Message();
            expect(message.getCurrentProcessingStep()).toBeNull();

            message.processing_metadata = {};
            expect(message.getCurrentProcessingStep()).toBeNull();

            message.processing_metadata = { processing_steps: [] };
            expect(message.getCurrentProcessingStep()).toBeNull();
        });
    });

    describe("Protocol Submission", () => {
        it("should handle all protocol submission type combinations", () => {
            const message = new Message();
            message.status = MessageStatus.VALIDATED;

            // Test each protocol submission type
            for (const type of Object.values(ProtocolSubmissionType)) {
                message.protocol_submission_type = type;
                const requiresSettlement = [ProtocolSubmissionType.PACS_008, ProtocolSubmissionType.PACS_009].includes(type);

                expect(message.requiresSettlement()).toBe(requiresSettlement);
                expect(message.canSubmitToProtocol()).toBe(true);
            }
        });

        it("should correctly determine if message can be submitted to protocol", () => {
            const message = new Message();
            message.status = MessageStatus.VALIDATED;
            message.protocol_submission_type = ProtocolSubmissionType.PACS_008;

            expect(message.canSubmitToProtocol()).toBe(true);

            // Should return false if already has protocol_message_id
            message.protocol_message_id = "MSG123";
            expect(message.canSubmitToProtocol()).toBe(false);

            // Should return false if status is not VALIDATED
            message.protocol_message_id = undefined;
            message.status = MessageStatus.DRAFT;
            expect(message.canSubmitToProtocol()).toBe(false);
        });

        it("should correctly identify messages requiring settlement", () => {
            const message = new Message();

            message.protocol_submission_type = ProtocolSubmissionType.PACS_008;
            expect(message.requiresSettlement()).toBe(true);

            message.protocol_submission_type = ProtocolSubmissionType.PACS_009;
            expect(message.requiresSettlement()).toBe(true);

            message.protocol_submission_type = ProtocolSubmissionType.CAMT_056;
            expect(message.requiresSettlement()).toBe(false);

            message.protocol_submission_type = ProtocolSubmissionType.CAMT_029;
            expect(message.requiresSettlement()).toBe(false);
        });
    });

    describe("Settlement Details", () => {
        it("should handle settlement information correctly", () => {
            const message = new Message();
            const settlementDate = new Date();
            const settlementDetails = {
                status: "COMPLETED",
                amount: "1000",
                currency: "USD",
                settlement_date: settlementDate,
                settlement_reference: "REF123"
            };

            message.settlement_id = "SETT123";
            message.settlement_details = settlementDetails;

            expect(message.settlement_id).toBe("SETT123");
            expect(message.settlement_details).toEqual(settlementDetails);
            expect(message.settlement_details?.settlement_date).toBe(settlementDate);
        });
    });

    describe("Blockchain Details", () => {
        it("should handle blockchain information correctly", () => {
            const message = new Message();
            const timestamp = new Date();

            const txHash = "0x123abc";
            const blockNumber = "12345";
            const targetChainId = 1;
            const targetAddress = "0x1234567890123456789012345678901234567890";

            message.transaction_hash = txHash;
            message.block_number = blockNumber;
            message.block_timestamp = timestamp;
            message.target_chain_id = targetChainId;
            message.target_address = targetAddress;

            expect(message.transaction_hash).toBe(txHash);
            expect(message.block_number).toBe(blockNumber);
            expect(message.block_timestamp).toBe(timestamp);
            expect(message.target_chain_id).toBe(targetChainId);
            expect(message.target_address).toBe(targetAddress);
        });
    });
});
