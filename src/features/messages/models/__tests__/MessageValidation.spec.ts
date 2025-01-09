//src/features/messages/models/__tests__/MessageValidation.spec.ts

import { PlatformTest } from "@tsed/platform-http/testing";
import { validate } from "class-validator";
import { beforeEach, describe, expect, it } from "vitest";

import { MessageValidation, ValidationResult } from "../MessageValidation.js";

describe("MessageValidation Entity", () => {
    beforeEach(PlatformTest.create);

    describe("Validation", () => {
        it("should validate a valid validation record", async () => {
            const validation = new MessageValidation();
            validation.validation_type = "ISO20022";
            validation.result = ValidationResult.PASSED;
            validation.details = {
                context: { schema: "pacs.008.001.09" }
            };
            validation.message_id = "550e8400-e29b-41d4-a716-446655440000";
            validation.performed_by = "550e8400-e29b-41d4-a716-446655440000";
            validation.version = 1;

            const errors = await validate(validation);
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
            const validation = new MessageValidation();
            const errors = await validate(validation);

            const requiredFields = ["validation_type", "details", "message_id", "performed_by"];
            const actualFields = errors.map((e) => e.property).filter((p) => requiredFields.includes(p));

            expect(actualFields.sort()).toEqual(requiredFields.sort());
        });

        it("should validate with validation errors", async () => {
            const validation = new MessageValidation();
            validation.validation_type = "ISO20022";
            validation.result = ValidationResult.FAILED;
            validation.details = {
                errors: [
                    {
                        code: "SCHEMA_ERROR",
                        message: "Invalid field value",
                        path: "Document.amount"
                    }
                ],
                context: { schema: "pacs.008.001.09" }
            };
            validation.message_id = "550e8400-e29b-41d4-a716-446655440000";
            validation.performed_by = "550e8400-e29b-41d4-a716-446655440000";
            validation.version = 1;

            const errors = await validate(validation);
            expect(errors).toHaveLength(0);
        });

        it("should validate with warnings", async () => {
            const validation = new MessageValidation();
            validation.validation_type = "ISO20022";
            validation.result = ValidationResult.WARNING;
            validation.details = {
                warnings: [
                    {
                        code: "RECOMMENDED_FIELD",
                        message: "Optional field missing",
                        path: "Document.purpose"
                    }
                ],
                context: { schema: "pacs.008.001.09" }
            };
            validation.message_id = "550e8400-e29b-41d4-a716-446655440000";
            validation.performed_by = "550e8400-e29b-41d4-a716-446655440000";
            validation.version = 1;

            const errors = await validate(validation);
            expect(errors).toHaveLength(0);
        });
    });

    describe("Result Status", () => {
        it("should default to FAILED status", () => {
            const validation = new MessageValidation();
            expect(validation.result).toBe(ValidationResult.FAILED);
        });

        it("should handle all validation result types", () => {
            const validation = new MessageValidation();

            validation.result = ValidationResult.PASSED;
            expect(validation.result).toBe(ValidationResult.PASSED);

            validation.result = ValidationResult.WARNING;
            expect(validation.result).toBe(ValidationResult.WARNING);

            validation.result = ValidationResult.FAILED;
            expect(validation.result).toBe(ValidationResult.FAILED);
        });
    });

    describe("Schema Version", () => {
        it("should handle optional schema version", () => {
            const validation = new MessageValidation();
            expect(validation.schema_version).toBeUndefined();

            validation.schema_version = "2019";
            expect(validation.schema_version).toBe("2019");
        });
    });

    describe("Version Tracking", () => {
        it("should track message version", () => {
            const validation = new MessageValidation();
            validation.version = 2;
            expect(validation.version).toBe(2);
        });
    });
});
