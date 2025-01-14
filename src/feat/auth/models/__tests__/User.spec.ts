// src/auth/models/__tests__/User.spec.ts

import { PlatformTest } from "@tsed/platform-http/testing";
import { validate } from "class-validator";
import { beforeEach, describe, expect, it } from "vitest";

import { Role } from "../Role.js";
import { User } from "../User.js";

describe("User Entity", () => {
    beforeEach(PlatformTest.create);

    describe("Validation", () => {
        it("should validate a valid user", async () => {
            const user = new User();
            user.id = "550e8400-e29b-41d4-a716-446655440000";
            user.first_name = "John";
            user.last_name = "Doe";
            user.email = "john.doe@example.com";
            user.password_hash = "hashedpassword123"; // At least 8 characters
            user.primary_institution_id = "550e8400-e29b-41d4-a716-446655440000";

            const errors = await validate(user);
            expect(errors).toHaveLength(0);
        });

        it("should fail validation for missing required fields", async () => {
            const user = new User();
            const errors = await validate(user);

            const requiredFields = ["first_name", "last_name", "email", "password_hash", "primary_institution_id"];
            const actualFields = errors.map((e) => e.property).filter((p) => requiredFields.includes(p));

            expect(actualFields.sort()).toEqual(requiredFields.sort());
            expect(actualFields).toHaveLength(requiredFields.length);
        });

        it("should validate email format", async () => {
            const user = new User();
            user.first_name = "John";
            user.last_name = "Doe";
            user.primary_institution_id = "550e8400-e29b-41d4-a716-446655440000";
            user.password_hash = "hashedpassword123";

            // Invalid email
            user.email = "invalid-email";
            let errors = await validate(user);
            let emailErrors = errors.filter((e) => e.property === "email");
            expect(emailErrors).toHaveLength(1);

            // Valid email
            user.email = "john.doe@example.com";
            errors = await validate(user);
            emailErrors = errors.filter((e) => e.property === "email");
            expect(emailErrors).toHaveLength(0);
        });

        it("should validate UUID fields", async () => {
            const user = new User();
            user.first_name = "John";
            user.last_name = "Doe";
            user.email = "john.doe@example.com";
            user.password_hash = "hashedpassword123";
            user.primary_institution_id = "invalid-uuid";

            const errors = await validate(user);
            const uuidErrors = errors.filter((e) => e.property === "primary_institution_id" && e.constraints?.isUuid);
            expect(uuidErrors).toHaveLength(1);
        });

        it("should validate optional fields when provided", async () => {
            const user = new User();
            user.first_name = "John";
            user.last_name = "Doe";
            user.email = "john.doe@example.com";
            user.password_hash = "hashedpassword123";
            user.primary_institution_id = "550e8400-e29b-41d4-a716-446655440000";

            // Add optional fields
            user.last_login_at = new Date();
            user.preferences = {
                timezone: "UTC",
                language: "en",
                notifications: {
                    email: true,
                    web: true
                },
                theme: "light"
            };

            const errors = await validate(user);
            expect(errors).toHaveLength(0);
        });
    });

    describe("Default Values", () => {
        it("should initialize with correct default values", () => {
            const user = new User();

            expect(user.is_active).toBe(false);
            expect(user.email_verified).toBe(false);
            expect(user.last_login_at).toBeUndefined();
            expect(user.preferences).toBeUndefined();
        });
    });

    describe("Name Management", () => {
        it("should return correct full name", () => {
            const user = new User();
            user.first_name = "John";
            user.last_name = "Doe";

            expect(user.getFullName()).toBe("John Doe");
        });

        it("should handle names with spaces", () => {
            const user = new User();
            user.first_name = "Mary Jane";
            user.last_name = "Smith Jones";

            expect(user.getFullName()).toBe("Mary Jane Smith Jones");
        });
    });

    describe("Role Management", () => {
        it("should handle role checking with no roles", () => {
            const user = new User();
            expect(user.hasRole("admin")).toBe(false);
        });

        it("should correctly check role existence", () => {
            const user = new User();
            const adminRole = new Role();
            adminRole.name = "admin";

            user.roles = [adminRole];

            expect(user.hasRole("admin")).toBe(true);
            expect(user.hasRole("user")).toBe(false);
        });

        it("should check roles case-sensitively", () => {
            const user = new User();
            const adminRole = new Role();
            adminRole.name = "Admin";

            user.roles = [adminRole];

            expect(user.hasRole("Admin")).toBe(true);
            expect(user.hasRole("admin")).toBe(false);
        });

        it("should handle multiple roles", () => {
            const user = new User();
            const roles = [
                Object.assign(new Role(), { name: "admin" }),
                Object.assign(new Role(), { name: "user" }),
                Object.assign(new Role(), { name: "manager" })
            ];

            user.roles = roles;

            expect(user.hasRole("admin")).toBe(true);
            expect(user.hasRole("user")).toBe(true);
            expect(user.hasRole("manager")).toBe(true);
            expect(user.hasRole("other")).toBe(false);
        });
    });

    describe("Preferences", () => {
        it("should handle complete preferences", () => {
            const user = new User();
            const preferences = {
                timezone: "UTC",
                language: "en",
                notifications: {
                    email: true,
                    web: true
                },
                theme: "dark"
            };

            user.preferences = preferences;
            expect(user.preferences).toEqual(preferences);
        });

        it("should handle partial preferences", () => {
            const user = new User();
            const preferences = {
                timezone: "UTC",
                language: "en"
            };

            user.preferences = preferences;
            expect(user.preferences.timezone).toBe("UTC");
            expect(user.preferences.language).toBe("en");
            expect(user.preferences.notifications).toBeUndefined();
            expect(user.preferences.theme).toBeUndefined();
        });

        it("should handle null preferences", () => {
            const user = new User();
            expect(user.preferences).toBeUndefined();
        });
    });
});
