//src/institutions/models/__tests__/InstitutionPermission.spec.ts

import { PlatformTest } from "@tsed/platform-http/testing";
import { validate } from "class-validator";
import { beforeEach, describe, expect, it } from "vitest";

import { InstitutionPermission, PermissionLevel, PermissionType } from "../InstitutionPermission.js";

describe("InstitutionPermission Entity", () => {
    beforeEach(PlatformTest.create);

    describe("Validation", () => {
        it("should validate a valid permission", async () => {
            const permission = new InstitutionPermission();
            permission.permission_type = PermissionType.MESSAGE_TYPE;
            permission.permission_key = "pacs.008";
            permission.level = PermissionLevel.READ;
            permission.institution_id = "550e8400-e29b-41d4-a716-446655440000";
            permission.granted_by = "550e8400-e29b-41d4-a716-446655440000";

            const errors = await validate(permission);
            expect(errors).toHaveLength(0);
        });

        it("should fail validation for missing required fields", async () => {
            const permission = new InstitutionPermission();
            const errors = await validate(permission);

            const requiredFields = ["permission_type", "permission_key", "institution_id", "granted_by"];
            const actualFields = errors.map((e) => e.property).filter((p) => requiredFields.includes(p));

            expect(actualFields.sort()).toEqual(requiredFields.sort());
        });
    });

    describe("Permission Level", () => {
        it("should initialize with NONE level", () => {
            const permission = new InstitutionPermission();
            expect(permission.level).toBe(PermissionLevel.NONE);
        });

        it("should handle access level checks", () => {
            const permission = new InstitutionPermission();

            permission.level = PermissionLevel.WRITE;
            expect(permission.canAccess(PermissionLevel.READ)).toBe(true);
            expect(permission.canAccess(PermissionLevel.WRITE)).toBe(true);
            expect(permission.canAccess(PermissionLevel.FULL)).toBe(false);

            permission.level = PermissionLevel.FULL;
            expect(permission.canAccess(PermissionLevel.READ)).toBe(true);
            expect(permission.canAccess(PermissionLevel.WRITE)).toBe(true);
            expect(permission.canAccess(PermissionLevel.FULL)).toBe(true);
        });
    });

    describe("Time Restrictions", () => {
        it("should validate with no time restrictions", () => {
            const permission = new InstitutionPermission();
            expect(permission.isWithinTimeRestrictions()).toBe(true);
        });

        it("should validate day of week restrictions", () => {
            const permission = new InstitutionPermission();
            const now = new Date();
            const currentDay = now.getDay();

            permission.constraints = {
                time_restrictions: {
                    days_of_week: [currentDay]
                }
            };
            expect(permission.isWithinTimeRestrictions()).toBe(true);

            permission.constraints.time_restrictions.days_of_week = [currentDay === 6 ? 0 : currentDay + 1]; // next day
            expect(permission.isWithinTimeRestrictions()).toBe(false);
        });

        it("should validate time of day restrictions", () => {
            const permission = new InstitutionPermission();
            const now = new Date();
            const currentTime = now.toLocaleTimeString("en-US", { timeZone: "UTC" });

            permission.constraints = {
                time_restrictions: {
                    start_time: "00:00:00",
                    end_time: "23:59:59",
                    timezone: "UTC"
                }
            };
            expect(permission.isWithinTimeRestrictions()).toBe(true);

            permission.constraints.time_restrictions = {
                start_time: "00:00:00",
                end_time: "00:00:01",
                timezone: "UTC"
            };
            expect(permission.isWithinTimeRestrictions()).toBe(false);
        });
    });

    describe("Volume Limits", () => {
        it("should validate with no volume limits", () => {
            const permission = new InstitutionPermission();
            expect(permission.isWithinVolumeLimits(1000)).toBe(true);
        });

        it("should enforce volume limits", () => {
            const permission = new InstitutionPermission();
            permission.constraints = {
                volume_limits: {
                    daily_limit: 100,
                    monthly_limit: 1000,
                    transaction_limit: 50
                }
            };

            expect(permission.isWithinVolumeLimits(50)).toBe(true);
            expect(permission.isWithinVolumeLimits(150)).toBe(false);
        });

        it("should validate individual limits", () => {
            const permission = new InstitutionPermission();

            // Test daily limit
            permission.constraints = {
                volume_limits: { daily_limit: 100 }
            };
            expect(permission.isWithinVolumeLimits(50)).toBe(true);
            expect(permission.isWithinVolumeLimits(150)).toBe(false);

            // Test monthly limit
            permission.constraints = {
                volume_limits: { monthly_limit: 1000 }
            };
            expect(permission.isWithinVolumeLimits(500)).toBe(true);
            expect(permission.isWithinVolumeLimits(1500)).toBe(false);

            // Test transaction limit
            permission.constraints = {
                volume_limits: { transaction_limit: 50 }
            };
            expect(permission.isWithinVolumeLimits(25)).toBe(true);
            expect(permission.isWithinVolumeLimits(75)).toBe(false);
        });
    });

    describe("Active Status", () => {
        it("should check active status with no restrictions", () => {
            const permission = new InstitutionPermission();
            expect(permission.isActive()).toBe(true);
        });

        it("should respect revocation", () => {
            const permission = new InstitutionPermission();
            permission.revoked_at = new Date();
            expect(permission.isActive()).toBe(false);
        });

        it("should enforce validity period", () => {
            const permission = new InstitutionPermission();
            const now = new Date();
            const past = new Date(now.getTime() - 1000 * 60 * 60); // 1 hour ago
            const future = new Date(now.getTime() + 1000 * 60 * 60); // 1 hour from now

            // Test valid period
            permission.valid_from = past;
            permission.valid_until = future;
            expect(permission.isActive()).toBe(true);

            // Test expired
            permission.valid_from = past;
            permission.valid_until = past;
            expect(permission.isActive()).toBe(false);

            // Test not yet valid
            permission.valid_from = future;
            permission.valid_until = future;
            expect(permission.isActive()).toBe(false);
        });
    });

    describe("Change History", () => {
        it("should track permission changes", () => {
            const permission = new InstitutionPermission();
            const change = {
                timestamp: new Date(),
                user_id: "user123",
                action: "modify" as const,
                old_level: PermissionLevel.READ,
                new_level: PermissionLevel.WRITE,
                reason: "Role upgrade"
            };

            permission.change_history = [change];
            expect(permission.change_history).toHaveLength(1);
            expect(permission.change_history[0].action).toBe("modify");
            expect(permission.change_history[0].reason).toBe("Role upgrade");
        });
    });
});
