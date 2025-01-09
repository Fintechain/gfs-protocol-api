//src/institutions/models/__tests__/InstitutionConfig.spec.ts

import { PlatformTest } from "@tsed/platform-http/testing";
import { validate } from "class-validator";
import { beforeEach, describe, expect, it } from "vitest";

import { ConfigStatus, ConfigType, InstitutionConfig } from "../InstitutionConfig.js";

describe("InstitutionConfig Entity", () => {
    beforeEach(PlatformTest.create);

    describe("Validation", () => {
        it("should validate a valid configuration", async () => {
            const config = new InstitutionConfig();
            config.name = "Default Config";
            config.type = ConfigType.MESSAGING;
            config.settings = { rateLimit: 1000 };
            config.institution_id = "550e8400-e29b-41d4-a716-446655440000";
            config.created_by = "550e8400-e29b-41d4-a716-446655440000";

            const errors = await validate(config);
            expect(errors).toHaveLength(0);
        });

        it("should fail validation for missing required fields", async () => {
            const config = new InstitutionConfig();
            const errors = await validate(config);

            const requiredFields = ["name", "type", "settings", "institution_id", "created_by"];
            const actualFields = errors.map((e) => e.property).filter((p) => requiredFields.includes(p));

            expect(actualFields.sort()).toEqual(requiredFields.sort());
        });
    });

    describe("Status Management", () => {
        it("should initialize with DRAFT status", () => {
            const config = new InstitutionConfig();
            expect(config.status).toBe(ConfigStatus.DRAFT);
        });

        it("should handle status helpers", () => {
            const config = new InstitutionConfig();

            config.status = ConfigStatus.ACTIVE;
            expect(config.isActive()).toBe(true);

            config.status = ConfigStatus.PENDING_APPROVAL;
            expect(config.needsApproval()).toBe(true);
            expect(config.isActive()).toBe(false);
        });
    });

    describe("Configuration Types", () => {
        it("should handle all config types", () => {
            const config = new InstitutionConfig();
            Object.values(ConfigType).forEach((type) => {
                config.type = type;
                expect(config.type).toBe(type);
            });
        });
    });

    describe("Version Management", () => {
        it("should track version number", () => {
            const config = new InstitutionConfig();
            config.version = 1;
            expect(config.version).toBe(1);
        });

        it("should track change history", () => {
            const config = new InstitutionConfig();
            const change = {
                version: 2,
                timestamp: new Date(),
                user_id: "user123",
                changes: [
                    {
                        path: "settings.rateLimit",
                        old_value: 1000,
                        new_value: 2000
                    }
                ]
            };

            config.change_history = [change];
            expect(config.change_history).toHaveLength(1);
            expect(config.change_history[0].changes[0].path).toBe("settings.rateLimit");
        });
    });

    describe("Settings Management", () => {
        it("should retrieve nested settings", () => {
            const config = new InstitutionConfig();
            config.settings = {
                messaging: {
                    rateLimit: 1000,
                    protocols: {
                        iso20022: {
                            enabled: true
                        }
                    }
                }
            };

            expect(config.getConfigValue("messaging.rateLimit")).toBe(1000);
            expect(config.getConfigValue("messaging.protocols.iso20022.enabled")).toBe(true);
            expect(config.getConfigValue("nonexistent.path", "default")).toBe("default");
        });

        it("should handle missing settings paths", () => {
            const config = new InstitutionConfig();
            config.settings = { key: "value" };

            expect(config.getConfigValue("nonexistent")).toBeUndefined();
            expect(config.getConfigValue("nonexistent", "default")).toBe("default");
        });
    });

    describe("Validation Results", () => {
        it("should track validation results", () => {
            const config = new InstitutionConfig();
            config.validation_results = {
                is_valid: false,
                errors: [
                    {
                        path: "settings.rateLimit",
                        message: "Must be positive number"
                    }
                ],
                warnings: [
                    {
                        path: "settings.timeout",
                        message: "Recommended value is 30s"
                    }
                ]
            };

            expect(config.validation_results.is_valid).toBe(false);
            expect(config.validation_results.errors).toHaveLength(1);
            expect(config.validation_results.warnings).toHaveLength(1);
        });
    });
});
