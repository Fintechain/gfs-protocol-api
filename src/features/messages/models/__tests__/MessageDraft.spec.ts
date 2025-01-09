// src/features/messages/models/__tests__/MessageDraft.spec.ts

import { PlatformTest } from "@tsed/platform-http/testing";
import { validate } from "class-validator";
import { beforeEach, describe, expect, it } from "vitest";

import { DraftStatus, MessageDraft } from "../MessageDraft.js";

describe("MessageDraft Entity", () => {
    beforeEach(PlatformTest.create);

    describe("Validation", () => {
        it("should validate a valid draft", async () => {
            const draft = new MessageDraft();
            draft.message_type = "pacs.008";
            draft.payload = { amount: 100 };
            draft.xml_payload = "<xml>test</xml>";
            draft.status = DraftStatus.INITIAL;
            draft.institution_id = "550e8400-e29b-41d4-a716-446655440000";
            draft.created_by = "550e8400-e29b-41d4-a716-446655440000";
            draft.is_complete = false;

            const errors = await validate(draft);
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
            const draft = new MessageDraft();
            const errors = await validate(draft);

            const requiredFields = ["message_type", "institution_id", "created_by"];
            const actualFields = errors.map((e) => e.property).filter((p) => requiredFields.includes(p));

            expect(actualFields.sort()).toEqual(requiredFields.sort());
            expect(actualFields).toHaveLength(3);
        });

        it("should allow nullable payload and xml_payload", async () => {
            const draft = new MessageDraft();
            draft.message_type = "pacs.008";
            draft.institution_id = "550e8400-e29b-41d4-a716-446655440000";
            draft.created_by = "550e8400-e29b-41d4-a716-446655440000";
            draft.status = DraftStatus.INITIAL;

            const errors = await validate(draft);
            const payloadErrors = errors.filter((e) => ["payload", "xml_payload"].includes(e.property));
            expect(payloadErrors).toHaveLength(0);
        });

        it("should validate optional metadata", async () => {
            const draft = new MessageDraft();
            draft.message_type = "pacs.008";
            draft.institution_id = "550e8400-e29b-41d4-a716-446655440000";
            draft.created_by = "550e8400-e29b-41d4-a716-446655440000";
            draft.metadata = {
                source_system: "TEST",
                reference_number: "REF123",
                tags: ["test", "draft"],
                custom_fields: {
                    priority: "high"
                }
            };

            const errors = await validate(draft);
            const metadataErrors = errors.filter((e) => e.property === "metadata");
            expect(metadataErrors).toHaveLength(0);
        });
    });

    describe("Status Management", () => {
        it("should initialize with INITIAL status", () => {
            const draft = new MessageDraft();
            expect(draft.status).toBe(DraftStatus.INITIAL);
        });

        it("should handle status transitions", () => {
            const draft = new MessageDraft();
            draft.status = DraftStatus.IN_PROGRESS;
            expect(draft.status).toBe(DraftStatus.IN_PROGRESS);

            draft.status = DraftStatus.COMPLETE;
            expect(draft.status).toBe(DraftStatus.COMPLETE);
        });
    });

    describe("Conversion Validation", () => {
        it("should validate complete draft for conversion", () => {
            const draft = new MessageDraft();
            draft.status = DraftStatus.COMPLETE;
            draft.is_complete = true;

            const issues = draft.validateForConversion();
            expect(issues).toHaveLength(0);
        });

        it("should fail validation for incomplete draft", () => {
            const draft = new MessageDraft();
            draft.status = DraftStatus.IN_PROGRESS;
            draft.is_complete = false;

            const issues = draft.validateForConversion();
            expect(issues.length).toBeGreaterThan(0);
            expect(issues[0].code).toBe("INCOMPLETE_DRAFT");
        });

        it("should fail validation for already converted draft", () => {
            const draft = new MessageDraft();
            draft.is_complete = true;
            draft.status = DraftStatus.CONVERTED;

            const issues = draft.validateForConversion();
            expect(issues.length).toBeGreaterThan(0);
            expect(issues[0].code).toBe("ALREADY_CONVERTED");
        });

        it("should fail validation for discarded draft", () => {
            const draft = new MessageDraft();
            draft.is_complete = true;
            draft.status = DraftStatus.DISCARDED;

            const issues = draft.validateForConversion();
            expect(issues.length).toBeGreaterThan(0);
            expect(issues[0].code).toBe("DISCARDED_DRAFT");
        });
    });

    describe("Validation Issues", () => {
        it("should track validation issues", () => {
            const draft = new MessageDraft();
            const issues = [
                {
                    field: "amount",
                    code: "INVALID_AMOUNT",
                    message: "Amount must be positive",
                    severity: "error" as const
                }
            ];

            draft.validation_issues = issues;
            expect(draft.validation_issues).toEqual(issues);
        });
    });

    describe("Expiration", () => {
        it("should set default expiration on insert", () => {
            const draft = new MessageDraft();
            // temp fix
            (draft as any).beforeInsert();
            expect(draft.expires_at).toBeDefined();
            expect(draft.expires_at).toBeInstanceOf(Date);
        });

        it("should respect custom expiration", () => {
            const draft = new MessageDraft();
            const customExpiration = new Date();
            draft.expires_at = customExpiration;
            (draft as any).beforeInsert();
            expect(draft.expires_at).toBe(customExpiration);
        });
    });
});
