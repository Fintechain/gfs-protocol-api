// src/auth/models/__tests__/Permission.spec.ts

import { PlatformTest } from "@tsed/platform-http/testing";
import { validate } from "class-validator";
import { beforeEach, describe, expect, it } from "vitest";

import { Permission, PermissionAction, ResourceType } from "../Permission.js";

describe("Permission Entity", () => {
    beforeEach(PlatformTest.create);

    describe("Validation", () => {
        it("should validate a valid permission", async () => {
            const permission = new Permission();
            permission.id = "550e8400-e29b-41d4-a716-446655440000";
            permission.code = "messages:read";
            permission.name = "Read Messages";
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
            expect(actualFields).toHaveLength(requiredFields.length);
        });

        it("should validate optional fields when provided", async () => {
            const permission = new Permission();
            permission.code = "messages:read";
            permission.name = "Read Messages";
            permission.resource_type = ResourceType.MESSAGE;
            permission.action = PermissionAction.READ;

            // Add optional fields
            permission.description = "Permission to read messages";
            permission.parent_id = "550e8400-e29b-41d4-a716-446655440000";
            permission.conditions = {
                attributes: ["content", "status"],
                constraints: { status: ["DRAFT", "PENDING"] },
                dependencies: ["auth:basic"]
            };
            permission.metadata = {
                ui_category: "Messages",
                risk_level: "LOW",
                requires_2fa: true,
                audit_trail: true
            };

            const errors = await validate(permission);
            expect(errors).toHaveLength(0);
        });

        it("should fail validation for invalid UUID fields", async () => {
            const permission = new Permission();
            permission.code = "messages:read";
            permission.name = "Read Messages";
            permission.resource_type = ResourceType.MESSAGE;
            permission.action = PermissionAction.READ;
            permission.parent_id = "invalid-uuid";

            const errors = await validate(permission);
            const uuidErrors = errors.filter((e) => e.property === "parent_id" && e.constraints?.isUuid);

            expect(uuidErrors).toHaveLength(1);
        });
    });

    describe("Resource Types and Actions", () => {
        it("should accept all valid resource types", async () => {
            const permission = new Permission();
            permission.code = "test";
            permission.name = "Test Permission";
            permission.action = PermissionAction.READ;

            for (const type of Object.values(ResourceType)) {
                permission.resource_type = type;
                const errors = await validate(permission);
                const resourceTypeErrors = errors.filter((e) => e.property === "resource_type");
                expect(resourceTypeErrors).toHaveLength(0);
            }
        });

        it("should accept all valid permission actions", async () => {
            const permission = new Permission();
            permission.code = "test";
            permission.name = "Test Permission";
            permission.resource_type = ResourceType.MESSAGE;

            for (const action of Object.values(PermissionAction)) {
                permission.action = action;
                const errors = await validate(permission);
                const actionErrors = errors.filter((e) => e.property === "action");
                expect(actionErrors).toHaveLength(0);
            }
        });
    });

    describe("Permission Path", () => {
        it("should return correct permission path for root permission", () => {
            const permission = new Permission();
            permission.code = "messages";

            expect(permission.getFullPermissionPath()).toBe("messages");
        });

        it("should return correct permission path for nested permission", () => {
            const parentPermission = new Permission();
            parentPermission.code = "messages";

            const childPermission = new Permission();
            childPermission.code = "read";
            childPermission.parent = parentPermission;

            expect(childPermission.getFullPermissionPath()).toBe("messages:read");
        });

        it("should return correct permission path for deeply nested permission", () => {
            const rootPermission = new Permission();
            rootPermission.code = "messages";

            const parentPermission = new Permission();
            parentPermission.code = "draft";
            parentPermission.parent = rootPermission;

            const childPermission = new Permission();
            childPermission.code = "read";
            childPermission.parent = parentPermission;

            expect(childPermission.getFullPermissionPath()).toBe("messages:draft:read");
        });
    });

    describe("Permission Matching", () => {
        it("should match exact permission codes", () => {
            const permission = new Permission();
            permission.code = "messages:read";

            expect(permission.matches("messages:read")).toBe(true);
            expect(permission.matches("messages:write")).toBe(false);
        });

        it("should match wildcard permissions", () => {
            const permission = new Permission();
            permission.code = "messages:read";

            expect(permission.matches("*")).toBe(true);
            expect(permission.matches("messages:*")).toBe(true);
            expect(permission.matches("audit:*")).toBe(false);
        });

        it("should handle nested permission wildcards", () => {
            const parentPermission = new Permission();
            parentPermission.code = "messages";

            const childPermission = new Permission();
            childPermission.code = "read";
            childPermission.parent = parentPermission;

            expect(childPermission.matches("messages:*")).toBe(true);
            expect(childPermission.matches("messages:read")).toBe(true);
            expect(childPermission.matches("messages:write")).toBe(false);
        });
    });

    describe("Metadata Features", () => {
        it("should correctly determine if permission requires 2FA", () => {
            const permission = new Permission();

            // Default case
            expect(permission.requiresTwoFactor()).toBe(false);

            // Explicit false case
            permission.metadata = { requires_2fa: false };
            expect(permission.requiresTwoFactor()).toBe(false);

            // True case
            permission.metadata = { requires_2fa: true };
            expect(permission.requiresTwoFactor()).toBe(true);
        });

        it("should correctly determine if permission requires audit", () => {
            const permission = new Permission();

            // Default case
            expect(permission.requiresAudit()).toBe(false);

            // Explicit false case
            permission.metadata = { audit_trail: false };
            expect(permission.requiresAudit()).toBe(false);

            // True case
            permission.metadata = { audit_trail: true };
            expect(permission.requiresAudit()).toBe(true);
        });

        it("should handle metadata with multiple properties", () => {
            const permission = new Permission();
            permission.metadata = {
                ui_category: "Security",
                risk_level: "HIGH",
                requires_2fa: true,
                audit_trail: true
            };

            expect(permission.metadata.ui_category).toBe("Security");
            expect(permission.metadata.risk_level).toBe("HIGH");
            expect(permission.requiresTwoFactor()).toBe(true);
            expect(permission.requiresAudit()).toBe(true);
        });
    });
});
