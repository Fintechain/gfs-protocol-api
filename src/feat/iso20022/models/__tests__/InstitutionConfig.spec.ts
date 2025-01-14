// src/institutions/models/__tests__/InstitutionConfig.spec.ts

import { PlatformTest } from "@tsed/platform-http/testing";
import { validate } from "class-validator";
import { beforeEach, describe, expect, it } from "vitest";

import { User } from "../../../auth/models/User.js";
import { Institution } from "../Institution.js";
import { ConfigStatus, ConfigType, InstitutionConfig } from "../InstitutionConfig.js";

describe("InstitutionConfig Entity", () => {
    beforeEach(PlatformTest.create);

    const createValidConfig = () => {
        const config = new InstitutionConfig();
        config.type = ConfigType.MESSAGING;
        config.name = "Test Config";
        config.settings = { test: true };
        config.institution_id = "550e8400-e29b-41d4-a716-446655440000";
        config.created_by = "550e8400-e29b-41d4-a716-446655440000";
        return config;
    };

    describe("Entity Creation and Updates", () => {
        it("should create a config with all fields", () => {
            const now = new Date();
            const config = createValidConfig();

            config.id = "550e8400-e29b-41d4-a716-446655440000";
            config.description = "Test Description";
            config.status = ConfigStatus.ACTIVE;
            config.version = 1;
            config.validation_schema = { type: "object" };
            config.updated_by = "550e8400-e29b-41d4-a716-446655440000";
            config.approved_by = "550e8400-e29b-41d4-a716-446655440000";
            config.created_at = now;
            config.updated_at = now;
            config.activated_at = now;
            config.approved_at = now;

            expect(config.id).toBe("550e8400-e29b-41d4-a716-446655440000");
            expect(config.type).toBe(ConfigType.MESSAGING);
            expect(config.name).toBe("Test Config");
            expect(config.description).toBe("Test Description");
            expect(config.settings).toEqual({ test: true });
            expect(config.status).toBe(ConfigStatus.ACTIVE);
            expect(config.version).toBe(1);
            expect(config.validation_schema).toEqual({ type: "object" });
            expect(config.institution_id).toBe("550e8400-e29b-41d4-a716-446655440000");
            expect(config.created_by).toBe("550e8400-e29b-41d4-a716-446655440000");
            expect(config.updated_by).toBe("550e8400-e29b-41d4-a716-446655440000");
            expect(config.approved_by).toBe("550e8400-e29b-41d4-a716-446655440000");
            expect(config.created_at).toBe(now);
            expect(config.updated_at).toBe(now);
            expect(config.activated_at).toBe(now);
            expect(config.approved_at).toBe(now);
        });

        it("should handle all config types", () => {
            const config = createValidConfig();
            const allTypes = Object.values(ConfigType);

            for (const type of allTypes) {
                config.type = type;
                expect(config.type).toBe(type);
            }

            expect(allTypes).toContain(ConfigType.MESSAGING);
            expect(allTypes).toContain(ConfigType.BLOCKCHAIN);
            expect(allTypes).toContain(ConfigType.COMPLIANCE);
            expect(allTypes).toContain(ConfigType.OPERATIONS);
            expect(allTypes).toContain(ConfigType.SECURITY);
        });

        it("should handle all config statuses", () => {
            const config = createValidConfig();
            const allStatuses = Object.values(ConfigStatus);

            for (const status of allStatuses) {
                config.status = status;
                expect(config.status).toBe(status);
            }

            expect(allStatuses).toContain(ConfigStatus.DRAFT);
            expect(allStatuses).toContain(ConfigStatus.ACTIVE);
            expect(allStatuses).toContain(ConfigStatus.INACTIVE);
            expect(allStatuses).toContain(ConfigStatus.PENDING_APPROVAL);
        });
    });

    describe("Entity Relationships", () => {
        it("should handle all relationships", () => {
            const config = createValidConfig();
            const institution = new Institution();
            const user = new User();

            institution.id = "550e8400-e29b-41d4-a716-446655440000";
            user.id = "550e8400-e29b-41d4-a716-446655440000";

            config.institution = institution;
            config.created_by_user = user;
            config.updated_by_user = user;
            config.approved_by_user = user;

            expect(config.institution).toBe(institution);
            expect(config.created_by_user).toBe(user);
            expect(config.updated_by_user).toBe(user);
            expect(config.approved_by_user).toBe(user);
            expect(config.institution_id).toBe("550e8400-e29b-41d4-a716-446655440000");
            expect(config.created_by).toBe("550e8400-e29b-41d4-a716-446655440000");
        });

        it("should allow nullable relationships", () => {
            const config = createValidConfig();
            expect(config.updated_by_user).toBeUndefined();
            expect(config.approved_by_user).toBeUndefined();
            expect(config.updated_by).toBeUndefined();
            expect(config.approved_by).toBeUndefined();
        });
    });

    describe("Validation", () => {
        it("should validate a valid config", async () => {
            const config = createValidConfig();
            const errors = await validate(config);
            expect(errors).toHaveLength(0);
        });

        it("should fail validation for missing required fields", async () => {
            const config = new InstitutionConfig();
            const errors = await validate(config);

            const requiredFields = ["type", "name", "settings", "institution_id", "created_by"];
            const actualFields = errors.map((e) => e.property).filter((p) => requiredFields.includes(p));

            expect(actualFields.sort()).toEqual(requiredFields.sort());
            expect(actualFields).toHaveLength(requiredFields.length);
        });

        it("should validate string length constraints", async () => {
            const config = createValidConfig();

            // Test name length constraint (100)
            config.name = ""; // Empty name - should fail IsNotEmpty validation
            let errors = await validate(config);
            expect(errors.some((e) => e.property === "name" && e.constraints?.isNotEmpty)).toBe(true);

            config.name = "Test Name"; // Valid name
            errors = await validate(config);
            expect(errors.some((e) => e.property === "name")).toBe(false);

            // Test description length constraint (500) - should fail IsString validation
            config.description = { invalid: "type" } as any;
            errors = await validate(config);
            const descriptionErrors = errors.filter((e) => e.property === "description");
            expect(descriptionErrors.length).toBeGreaterThan(0);
        });

        it("should validate UUID formats", async () => {
            const config = createValidConfig();
            const validUuid = "550e8400-e29b-41d4-a716-446655440000";
            const invalidUuid = "invalid-uuid";

            const uuidFields = [
                { field: "institution_id", required: true },
                { field: "created_by", required: true },
                { field: "updated_by", required: false },
                { field: "approved_by", required: false }
            ];

            for (const { field, required } of uuidFields) {
                // Test invalid UUID
                (config as any)[field] = invalidUuid;
                let errors = await validate(config);
                const uuidErrors = errors.filter((e) => e.property === field && e.constraints?.isUuid);
                expect(uuidErrors.length).toBeGreaterThan(0);

                // Test valid UUID
                (config as any)[field] = validUuid;
                errors = await validate(config);
                expect(errors.some((e) => e.property === field)).toBe(false);

                // Test undefined for optional fields
                if (!required) {
                    (config as any)[field] = undefined;
                    errors = await validate(config);
                    expect(errors.some((e) => e.property === field)).toBe(false);
                }
            }
        });
    });

    describe("Status Methods", () => {
        it("should correctly identify active status", () => {
            const config = createValidConfig();

            for (const status of Object.values(ConfigStatus)) {
                config.status = status;
                expect(config.isActive()).toBe(status === ConfigStatus.ACTIVE);
            }
        });

        it("should correctly identify pending approval status", () => {
            const config = createValidConfig();

            for (const status of Object.values(ConfigStatus)) {
                config.status = status;
                expect(config.needsApproval()).toBe(status === ConfigStatus.PENDING_APPROVAL);
            }
        });
    });

    describe("Config Value Management", () => {
        it("should correctly retrieve config values", () => {
            const config = createValidConfig();
            const complexSettings = {
                string: "value",
                number: 42,
                boolean: true,
                nested: {
                    array: [1, 2, 3],
                    object: {
                        deep: {
                            value: "found"
                        }
                    }
                }
            };
            config.settings = complexSettings;

            // Test all value types
            expect(config.getConfigValue("string")).toBe("value");
            expect(config.getConfigValue("number")).toBe(42);
            expect(config.getConfigValue("boolean")).toBe(true);
            expect(config.getConfigValue("nested.array")).toEqual([1, 2, 3]);
            expect(config.getConfigValue("nested.object.deep.value")).toBe("found");
        });

        it("should handle missing or invalid paths", () => {
            const config = createValidConfig();
            config.settings = {
                level1: {
                    level2: null,
                    level2Array: []
                }
            };

            expect(config.getConfigValue("nonexistent")).toBeUndefined();
            expect(config.getConfigValue("nonexistent", "default")).toBe("default");
            expect(config.getConfigValue("level1.nonexistent")).toBeUndefined();
            expect(config.getConfigValue("level1.level2Array.0")).toBeUndefined();
            expect(config.getConfigValue("")).toBeUndefined();
            expect(config.getConfigValue(".", "default")).toBe("default");
        });

        it("should handle edge cases in settings", () => {
            const config = createValidConfig();

            // Test with undefined settings
            config.settings = undefined as any;
            expect(config.getConfigValue("any.path")).toBeUndefined();
            expect(config.getConfigValue("any.path", "default")).toBe("default");

            // Test with null settings
            config.settings = null as any;
            expect(config.getConfigValue("any.path")).toBeUndefined();
            expect(config.getConfigValue("any.path", "default")).toBe("default");

            // Test with empty settings
            config.settings = {};
            expect(config.getConfigValue("any.path")).toBeUndefined();
            expect(config.getConfigValue("any.path", "default")).toBe("default");

            // Test with array settings
            config.settings = { array: [1, 2, 3] };
            expect(config.getConfigValue("array.0")).toBe(1);
            expect(config.getConfigValue("array.3")).toBeUndefined();
            expect(config.getConfigValue("array.3", "default")).toBe("default");
        });

        it("should handle null and undefined values", () => {
            const config = createValidConfig();
            config.settings = {
                nullValue: null,
                undefinedValue: undefined
            };

            expect(config.getConfigValue("nullValue")).toBeUndefined();
            expect(config.getConfigValue("nullValue", "default")).toBe("default");
            expect(config.getConfigValue("undefinedValue")).toBeUndefined();
            expect(config.getConfigValue("undefinedValue", "default")).toBe("default");
        });
    });

    describe("Change History", () => {
        it("should handle complete change history", () => {
            const config = createValidConfig();
            const now = new Date();
            const changeHistory = [
                {
                    version: 1,
                    timestamp: now,
                    user_id: "550e8400-e29b-41d4-a716-446655440000",
                    changes: [
                        {
                            path: "timeout",
                            old_value: 30,
                            new_value: 60
                        }
                    ],
                    notes: "Updated timeout value"
                },
                {
                    version: 2,
                    timestamp: now,
                    user_id: "550e8400-e29b-41d4-a716-446655440000",
                    changes: [
                        {
                            path: "retries",
                            old_value: 3,
                            new_value: 5
                        }
                    ]
                }
            ];

            config.change_history = changeHistory;
            expect(config.change_history).toEqual(changeHistory);
            expect(config.change_history[0].changes[0].old_value).toBe(30);
            expect(config.change_history[0].changes[0].new_value).toBe(60);
            expect(config.change_history[1].changes[0].old_value).toBe(3);
            expect(config.change_history[1].changes[0].new_value).toBe(5);
            expect(config.change_history[0].notes).toBe("Updated timeout value");
            expect(config.change_history[1].notes).toBeUndefined();
        });

        it("should handle empty change history", () => {
            const config = createValidConfig();
            config.change_history = [];
            expect(config.change_history).toEqual([]);
        });

        it("should handle undefined change history", () => {
            const config = createValidConfig();
            expect(config.change_history).toBeUndefined();
        });
    });

    describe("Validation Results", () => {
        it("should handle complete validation results", () => {
            const config = createValidConfig();
            const validationResults = {
                is_valid: false,
                errors: [
                    {
                        path: "settings.timeout",
                        message: "Must be positive"
                    },
                    {
                        path: "settings.maxRetries",
                        message: "Must be less than 10"
                    }
                ],
                warnings: [
                    {
                        path: "settings.retries",
                        message: "Using default value"
                    },
                    {
                        path: "settings.timeout",
                        message: "Recommended value is 30"
                    }
                ]
            };

            config.validation_results = validationResults;
            expect(config.validation_results).toEqual(validationResults);
            expect(config.validation_results.is_valid).toBe(false);
            expect(config.validation_results.errors).toHaveLength(2);
            expect(config.validation_results.warnings).toHaveLength(2);
            expect(config.validation_results.errors?.[0].path).toBe("settings.timeout");
            expect(config.validation_results.warnings?.[0].path).toBe("settings.retries");
        });

        it("should handle partial validation results", () => {
            const config = createValidConfig();

            // Only is_valid
            config.validation_results = { is_valid: true };
            expect(config.validation_results.is_valid).toBe(true);
            expect(config.validation_results.errors).toBeUndefined();
            expect(config.validation_results.warnings).toBeUndefined();

            // With only errors
            config.validation_results = {
                is_valid: false,
                errors: [{ path: "test", message: "Error" }]
            };
            expect(config.validation_results.is_valid).toBe(false);
            expect(config.validation_results.errors).toHaveLength(1);
            expect(config.validation_results.warnings).toBeUndefined();

            // With only warnings
            config.validation_results = {
                is_valid: true,
                warnings: [{ path: "test", message: "Warning" }]
            };
            expect(config.validation_results.is_valid).toBe(true);
            expect(config.validation_results.errors).toBeUndefined();
            expect(config.validation_results.warnings).toHaveLength(1);
        });

        it("should handle empty validation results arrays", () => {
            const config = createValidConfig();
            config.validation_results = {
                is_valid: true,
                errors: [],
                warnings: []
            };

            expect(config.validation_results.errors).toHaveLength(0);
            expect(config.validation_results.warnings).toHaveLength(0);
        });

        it("should handle undefined validation results", () => {
            const config = createValidConfig();
            expect(config.validation_results).toBeUndefined();
        });
    });
});
