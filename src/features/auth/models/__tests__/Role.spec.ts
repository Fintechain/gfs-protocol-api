//src/auth/models/__tests__/Role.spec.ts

import { PlatformTest } from "@tsed/platform-http/testing";
import { validate } from "class-validator";
import { beforeEach, describe, expect, it } from "vitest";

import { Role, RoleScope } from "../Role.js";

describe("Role Entity", () => {
    beforeEach(PlatformTest.create);

    describe("Validation", () => {
        it("should validate a valid role", async () => {
            const role = new Role();
            role.name = "Admin";
            role.scope = RoleScope.GLOBAL;
            role.permission_codes = ["message:read"];
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
        });
    });

    describe("Scope Management", () => {
        it("should initialize with INSTITUTION scope", () => {
            const role = new Role();
            expect(role.scope).toBe(RoleScope.INSTITUTION);
        });

        it("should handle scope helpers", () => {
            const role = new Role();

            role.scope = RoleScope.GLOBAL;
            expect(role.isGlobal()).toBe(true);
            expect(role.isInstitutionScoped()).toBe(false);

            role.scope = RoleScope.INSTITUTION;
            expect(role.isGlobal()).toBe(false);
            expect(role.isInstitutionScoped()).toBe(true);

            role.scope = RoleScope.TEAM;
            expect(role.isTeamScoped()).toBe(true);
        });
    });

    describe("Permission Management", () => {
        it("should handle permission checks", () => {
            const role = new Role();
            role.permission_codes = ["message:read", "user:write"];

            expect(role.hasPermission("message:read")).toBe(true);
            expect(role.hasPermission("message:write")).toBe(false);
        });

        it("should handle empty permissions", () => {
            const role = new Role();
            expect(role.hasPermission("message:read")).toBe(false);
        });
    });

    describe("System Role", () => {
        it("should handle system role flag", () => {
            const role = new Role();
            expect(role.is_system_role).toBe(false);

            role.is_system_role = true;
            expect(role.is_system_role).toBe(true);
        });
    });
});
