// src/auth/models/__tests__/Role.spec.ts

import { PlatformTest } from "@tsed/platform-http/testing";
import { validate } from "class-validator";
import { beforeEach, describe, expect, it } from "vitest";

import { Role, RoleScope } from "../Role.js";

describe("Role Entity", () => {
    beforeEach(PlatformTest.create);

    describe("Validation", () => {
        it("should validate a valid role", async () => {
            const role = new Role();
            role.id = "550e8400-e29b-41d4-a716-446655440000";
            role.name = "Admin";
            role.permission_codes = [];
            role.inherits_from = [];

            const errors = await validate(role);
            expect(errors).toHaveLength(0);
        });

        it("should fail validation for missing required fields", async () => {
            const role = new Role();
            const errors = await validate(role);

            const requiredFields = ["name"];
            const actualFields = errors.map((e) => e.property).filter((p) => requiredFields.includes(p));

            expect(actualFields.sort()).toEqual(requiredFields.sort());
            expect(actualFields).toHaveLength(requiredFields.length);
        });

        it("should validate optional fields when provided", async () => {
            const role = new Role();
            role.name = "Admin";
            role.description = "Administrator role";
            role.scope = RoleScope.GLOBAL;
            role.is_system_role = true;
            role.metadata = {
                display_name: "System Administrator",
                category: "System",
                priority: 1,
                custom_attributes: { maxLoginAttempts: 5 }
            };
            role.inherits_from = ["550e8400-e29b-41d4-a716-446655440000"];
            role.permission_codes = ["system:admin"];

            const errors = await validate(role);
            expect(errors).toHaveLength(0);
        });

        it("should fail validation for invalid UUID in inherits_from", async () => {
            const role = new Role();
            role.name = "Admin";
            role.inherits_from = ["invalid-uuid"];

            const errors = await validate(role);
            const uuidErrors = errors.filter((e) => e.property === "inherits_from");
            expect(uuidErrors).toHaveLength(1);
        });
    });

    describe("Default Values", () => {
        it("should have correct default values", () => {
            const role = new Role();
            role.permission_codes = [];
            role.inherits_from = [];

            expect(role.scope).toBe(RoleScope.INSTITUTION);
            expect(role.is_system_role).toBe(false);
            expect(role.inherits_from).toEqual([]);
            expect(role.permission_codes).toEqual([]);
        });
    });

    describe("Role Scope", () => {
        it("should validate all role scopes", async () => {
            const role = new Role();
            role.name = "Test Role";

            for (const scope of Object.values(RoleScope)) {
                role.scope = scope;
                const errors = await validate(role);
                const scopeErrors = errors.filter((e) => e.property === "scope");
                expect(scopeErrors).toHaveLength(0);
            }
        });

        it("should correctly identify scope types", () => {
            const role = new Role();
            role.name = "Test Role";

            role.scope = RoleScope.GLOBAL;
            expect(role.isGlobal()).toBe(true);
            expect(role.isInstitutionScoped()).toBe(false);
            expect(role.isTeamScoped()).toBe(false);

            role.scope = RoleScope.INSTITUTION;
            expect(role.isGlobal()).toBe(false);
            expect(role.isInstitutionScoped()).toBe(true);
            expect(role.isTeamScoped()).toBe(false);

            role.scope = RoleScope.TEAM;
            expect(role.isGlobal()).toBe(false);
            expect(role.isInstitutionScoped()).toBe(false);
            expect(role.isTeamScoped()).toBe(true);
        });
    });

    describe("Permission Management", () => {
        it("should correctly check permission existence", () => {
            const role = new Role();
            role.name = "Admin";
            role.permission_codes = ["system:read", "users:manage", "reports:view"];

            expect(role.hasPermission("system:read")).toBe(true);
            expect(role.hasPermission("users:manage")).toBe(true);
            expect(role.hasPermission("reports:view")).toBe(true);
            expect(role.hasPermission("nonexistent")).toBe(false);
        });

        it("should handle empty permission codes", () => {
            const role = new Role();
            role.name = "Empty Role";
            role.permission_codes = [];

            expect(role.hasPermission("any:permission")).toBe(false);
        });

        it("should validate permission codes array", async () => {
            const role = new Role();
            role.name = "Admin";
            role.permission_codes = ["system:admin", "users:manage"];

            const errors = await validate(role);
            const permissionErrors = errors.filter((e) => e.property === "permission_codes");
            expect(permissionErrors).toHaveLength(0);
        });
    });

    describe("Metadata", () => {
        it("should handle complete metadata", () => {
            const role = new Role();
            const metadata = {
                display_name: "System Admin",
                category: "System",
                priority: 1,
                custom_attributes: {
                    maxLoginAttempts: 5,
                    requiresMFA: true
                }
            };

            role.metadata = metadata;
            expect(role.metadata).toEqual(metadata);
        });

        it("should handle partial metadata", () => {
            const role = new Role();
            const metadata = {
                display_name: "Basic User"
            };

            role.metadata = metadata;
            expect(role.metadata.display_name).toBe("Basic User");
            expect(role.metadata.category).toBeUndefined();
            expect(role.metadata.priority).toBeUndefined();
            expect(role.metadata.custom_attributes).toBeUndefined();
        });

        it("should handle null metadata", () => {
            const role = new Role();
            expect(role.metadata).toBeUndefined();
        });
    });

    describe("Role Inheritance", () => {
        it("should validate valid inheritance array", async () => {
            const role = new Role();
            role.name = "Derived Role";
            role.inherits_from = ["550e8400-e29b-41d4-a716-446655440000", "650e8400-e29b-41d4-a716-446655440000"];

            const errors = await validate(role);
            const inheritanceErrors = errors.filter((e) => e.property === "inherits_from");
            expect(inheritanceErrors).toHaveLength(0);
        });

        it("should handle empty inheritance array", async () => {
            const role = new Role();
            role.name = "Base Role";
            role.inherits_from = [];

            const errors = await validate(role);
            const inheritanceErrors = errors.filter((e) => e.property === "inherits_from");
            expect(inheritanceErrors).toHaveLength(0);
        });
    });

    describe("System Role", () => {
        it("should handle system role flag", () => {
            const role = new Role();
            role.name = "System Role";

            expect(role.is_system_role).toBe(false);

            role.is_system_role = true;
            expect(role.is_system_role).toBe(true);
        });
    });
});
