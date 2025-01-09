//src/auth/models/__tests__/Permission.spec.ts

import { PlatformTest } from "@tsed/platform-http/testing";
import { validate } from "class-validator";
import { beforeEach, describe, expect, it } from "vitest";

import { Permission, PermissionAction, ResourceType } from "../Permission.js";

describe("Permission Entity", () => {
    beforeEach(PlatformTest.create);

    describe("Validation", () => {
        it("should validate a valid permission", async () => {
            const permission = new Permission();
            permission.code = "message:read";
            permission.name = "Read Message";
            permission.resource_type = ResourceType.MESSAGE;
            permission.action = PermissionAction.READ;

            const errors = await validate(permission);
            expect(errors).toHaveLength(0);
        });

        it("should fail validation for missing required fields", async () => {
            const permission = new Permission();
            const errors = await validate(permission);

            const requiredFields = ["code", "name", "resource_type", "action"];
            const actualFields = errors.map((e) => e.property).filter((p) => requiredFields.includes(p));

            expect(actualFields.sort()).toEqual(requiredFields.sort());
        });
    });

    describe("Permission Path", () => {
        it("should generate correct permission path", () => {
            const parent = new Permission();
            parent.code = "message";

            const child = new Permission();
            child.code = "read";
            child.parent = parent;

            expect(child.getFullPermissionPath()).toBe("message:read");
        });

        it("should handle permission matching", () => {
            const permission = new Permission();
            permission.code = "message:read:details";

            // Exact match
            expect(permission.matches("message:read:details")).toBe(true);
            // Wildcard match
            expect(permission.matches("message:*")).toBe(true);
            // Full wildcard
            expect(permission.matches("*")).toBe(true);
            // No match
            expect(permission.matches("user:read")).toBe(false);
        });
    });

    describe("Helper Methods", () => {
        it("should check two factor requirement", () => {
            const permission = new Permission();
            permission.metadata = { requires_2fa: true };
            expect(permission.requiresTwoFactor()).toBe(true);

            permission.metadata = { requires_2fa: false };
            expect(permission.requiresTwoFactor()).toBe(false);

            permission.metadata = undefined;
            expect(permission.requiresTwoFactor()).toBe(false);
        });

        it("should check audit requirement", () => {
            const permission = new Permission();
            permission.metadata = { audit_trail: true };
            expect(permission.requiresAudit()).toBe(true);

            permission.metadata = { audit_trail: false };
            expect(permission.requiresAudit()).toBe(false);

            permission.metadata = undefined;
            expect(permission.requiresAudit()).toBe(false);
        });
    });
});
