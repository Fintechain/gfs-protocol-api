//src/features/messages/models/__tests__/MessageTransformation.spec.ts

import { PlatformTest } from "@tsed/platform-http/testing";
import { validate } from "class-validator";
import { beforeEach, describe, expect, it } from "vitest";

import { MessageTransformation, TransformationStatus, TransformationType } from "../MessageTransformation.js";

describe("MessageTransformation Entity", () => {
    beforeEach(PlatformTest.create);

    describe("Validation", () => {
        it("should validate a valid transformation record", async () => {
            const transformation = new MessageTransformation();
            transformation.transformation_type = TransformationType.ISO20022_TO_MT;
            transformation.status = TransformationStatus.SUCCESS;
            transformation.source_format = "pacs.008.001.09";
            transformation.target_format = "mt103";
            transformation.source_version = "2019";
            transformation.target_version = "2021";
            transformation.transformation_details = {
                rules_applied: ["CurrencyConversion", "AmountFormatting"]
            };
            transformation.message_id = "550e8400-e29b-41d4-a716-446655440000";
            transformation.performed_by = "550e8400-e29b-41d4-a716-446655440000";
            transformation.version = 1;

            const errors = await validate(transformation);
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
            const transformation = new MessageTransformation();
            const errors = await validate(transformation);

            const requiredFields = [
                "transformation_type",
                "source_format",
                "target_format",
                "source_version",
                "target_version",
                "transformation_details",
                "message_id",
                "performed_by"
            ];
            const actualFields = errors.map((e) => e.property).filter((p) => requiredFields.includes(p));

            expect(actualFields.sort()).toEqual(requiredFields.sort());
        });

        it("should handle transformation errors", async () => {
            const transformation = new MessageTransformation();
            transformation.transformation_type = TransformationType.ISO20022_TO_MT;
            transformation.status = TransformationStatus.FAILED;
            transformation.source_format = "pacs.008.001.09";
            transformation.target_format = "mt103";
            transformation.source_version = "2019";
            transformation.target_version = "2021";
            transformation.transformation_details = {
                rules_applied: ["CurrencyConversion"],
                errors: [
                    {
                        code: "MAPPING_ERROR",
                        message: "Invalid field mapping",
                        field: "amount"
                    }
                ]
            };
            transformation.message_id = "550e8400-e29b-41d4-a716-446655440000";
            transformation.performed_by = "550e8400-e29b-41d4-a716-446655440000";
            transformation.version = 1;

            const errors = await validate(transformation);
            expect(errors).toHaveLength(0);
        });
    });

    describe("Transformation Types", () => {
        it("should handle all transformation types", () => {
            const transformation = new MessageTransformation();

            Object.values(TransformationType).forEach((type) => {
                transformation.transformation_type = type;
                expect(transformation.transformation_type).toBe(type);
            });
        });
    });

    describe("Status Management", () => {
        it("should default to FAILED status", () => {
            const transformation = new MessageTransformation();
            expect(transformation.status).toBe(TransformationStatus.FAILED);
        });

        it("should handle all status types", () => {
            const transformation = new MessageTransformation();

            Object.values(TransformationStatus).forEach((status) => {
                transformation.status = status;
                expect(transformation.status).toBe(status);
            });
        });
    });

    describe("Payload Management", () => {
        it("should handle optional payloads", () => {
            const transformation = new MessageTransformation();

            const sourcePayload = { amount: 100 };
            transformation.source_payload = sourcePayload;
            expect(transformation.source_payload).toEqual(sourcePayload);

            const targetPayload = { amount: "100.00" };
            transformation.target_payload = targetPayload;
            expect(transformation.target_payload).toEqual(targetPayload);
        });

        it("should handle XML payloads", () => {
            const transformation = new MessageTransformation();

            const sourceXml = "<Document><amount>100</amount></Document>";
            transformation.source_xml = sourceXml;
            expect(transformation.source_xml).toBe(sourceXml);

            const targetXml = "<MT103><amount>100.00</amount></MT103>";
            transformation.target_xml = targetXml;
            expect(transformation.target_xml).toBe(targetXml);
        });
    });
});
