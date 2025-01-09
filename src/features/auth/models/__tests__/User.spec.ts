//src/auth/models/__tests__/User.spec.ts

import { PlatformTest } from "@tsed/platform-http/testing";
import { validate } from "class-validator";
import { beforeEach, describe, expect, it } from "vitest";

import { User } from "../User.js";

describe("User Entity", () => {
    beforeEach(PlatformTest.create);

    describe("Validation", () => {
        it("should validate a valid user", async () => {
            const user = new User();
            user.first_name = "John";
            user.last_name = "Doe";
            user.email = "john@example.com";
            user.password_hash = "hashedpassword12345";
            user.primary_institution_id = "550e8400-e29b-41d4-a716-446655440000";

            const errors = await validate(user);
            expect(errors).toHaveLength(0);
        });

        it("should fail validation for missing required fields", async () => {
            const user = new User();
            const errors = await validate(user);

            const requiredFields = ["first_name", "last_name", "email", "primary_institution_id"];
            const actualFields = errors.map((e) => e.property).filter((p) => requiredFields.includes(p));

            expect(actualFields.sort()).toEqual(requiredFields.sort());
        });

        it("should validate email format", async () => {
            const user = new User();
            user.first_name = "John";
            user.last_name = "Doe";
            user.email = "invalid-email";
            user.primary_institution_id = "550e8400-e29b-41d4-a716-446655440000";

            const errors = await validate(user);
            expect(errors.some((e) => e.property === "email")).toBe(true);
        });
    });

    describe("Helper Methods", () => {
        it("should generate full name", () => {
            const user = new User();
            user.first_name = "John";
            user.last_name = "Doe";

            expect(user.getFullName()).toBe("John Doe");
        });

        it("should check role membership", () => {
            const user = new User();
            user.roles = [{ name: "admin" }, { name: "user" }] as any[];

            expect(user.hasRole("admin")).toBe(true);
            expect(user.hasRole("manager")).toBe(false);
        });

        it("should handle missing roles", () => {
            const user = new User();
            expect(user.hasRole("admin")).toBe(false);
        });
    });

    describe("Default Values", () => {
        it("should set default activity status", () => {
            const user = new User();
            expect(user.is_active).toBe(false);
        });

        it("should set default email verification status", () => {
            const user = new User();
            expect(user.email_verified).toBe(false);
        });
    });

    describe("Preferences", () => {
        it("should handle user preferences", () => {
            const user = new User();
            user.preferences = {
                timezone: "UTC",
                language: "en",
                notifications: {
                    email: true,
                    web: false
                },
                theme: "dark"
            };

            expect(user.preferences.timezone).toBe("UTC");
            expect(user?.preferences?.notifications?.email).toBe(true);
        });
    });
});
