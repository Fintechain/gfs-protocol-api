// src/features/messages/models/__tests__/Message.spec.ts

import { PlatformTest } from "@tsed/platform-http/testing";
import { validate } from "class-validator";
import { beforeEach, describe, expect, it } from "vitest";

import { Message, MessageStatus, ProtocolSubmissionType } from "../Message.js";

describe("Message Entity", () => {
    beforeEach(PlatformTest.create);

    describe("Validation", () => {
        it("should validate a valid message", async () => {
            const message = new Message();
            message.id = "550e8400-e29b-41d4-a716-446655440000";
            message.message_type = "pacs.008";
            message.protocol_submission_type = ProtocolSubmissionType.PACS_008;
            message.parsed_payload = { amount: 100 }; // Added parsed_payload
            message.xml_payload = "<xml>test</xml>";
            message.status = MessageStatus.DRAFT;
            message.institution_id = "550e8400-e29b-41d4-a716-446655440000";
            message.created_by = "550e8400-e29b-41d4-a716-446655440000";

            const errors = await validate(message);
            if (errors.length > 0) {
                console.log(
                    "Validation errors:",
                    errors.map((e) => ({
                        property: e.property,
                        constraints: e.constraints
                    }))
                );
            }
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
    });

    describe("Version Management", () => {
        it("should track version changes", () => {
            const message = new Message();
            message.version = 1;
            expect(message.version).toBe(1);

            message.version = 2;
            expect(message.version).toBe(2);
        });
    });

    describe("Transaction Status", () => {
        it("should handle transaction details properly", () => {
            const message = new Message();
            const txHash = "0x123...";
            const blockNumber = "12345";
            const timestamp = new Date();

            message.transaction_hash = txHash;
            message.block_number = blockNumber;
            message.block_timestamp = timestamp;

            expect(message.transaction_hash).toBe(txHash);
            expect(message.block_number).toBe(blockNumber);
            expect(message.block_timestamp).toBe(timestamp);
        });
    });

    describe("Audit Trail", () => {
        it("should track creation and update users", () => {
            const message = new Message();
            const userId = "550e8400-e29b-41d4-a716-446655440000";

            message.created_by = userId;
            expect(message.created_by).toBe(userId);

            message.updated_by = userId;
            expect(message.updated_by).toBe(userId);
        });
    });

    describe("XML Payload", () => {
        it("should store and retrieve XML payload", () => {
            const message = new Message();
            const xml = `
                <Document>
                    <FIToFIPmtStsRpt>
                        <GrpHdr>
                            <MsgId>ABC/120928/CCT001</MsgId>
                            <CreDtTm>2012-09-28T14:07:00</CreDtTm>
                        </GrpHdr>
                    </FIToFIPmtStsRpt>
                </Document>
            `;

            message.xml_payload = xml;
            expect(message.xml_payload).toBe(xml);
        });
    });
});
