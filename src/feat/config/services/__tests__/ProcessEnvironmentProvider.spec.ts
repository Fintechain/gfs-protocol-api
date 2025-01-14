/**
 * File: /src/features/config/services/__tests__/ProcessEnvironmentProvider.spec.ts
 * Tests for the ProcessEnvironmentProvider service
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProcessEnvironmentProvider } from "../ProcessEnvironmentProvider.js";

describe("ProcessEnvironmentProvider", () => {
    let provider: ProcessEnvironmentProvider;

    beforeEach(() => {
        // Reset environment before each test
        vi.resetModules();
        vi.stubEnv("TEST_VAR", "test_value");
        vi.stubEnv("ANOTHER_VAR", "another_value");

        provider = new ProcessEnvironmentProvider();
    });

    afterEach(() => {
        vi.unstubAllEnvs();
    });

    describe("get", () => {
        it("should return the value of an existing environment variable", () => {
            expect(provider.get("TEST_VAR")).toBe("test_value");
        });

        it("should return undefined for non-existent environment variable", () => {
            expect(provider.get("NON_EXISTENT")).toBeUndefined();
        });

        it("should handle empty string values", () => {
            vi.stubEnv("EMPTY_VAR", "");
            expect(provider.get("EMPTY_VAR")).toBe("");
        });

        it("should return undefined for null or undefined environment variables", () => {
            vi.stubEnv("NULL_VAR", undefined);
            vi.stubEnv("UNDEFINED_VAR", undefined);

            expect(provider.get("NULL_VAR")).toBeUndefined();
            expect(provider.get("UNDEFINED_VAR")).toBeUndefined();
        });
    });

    describe("getAll", () => {
        it("should return all environment variables", () => {
            const env = provider.getAll();

            expect(env.TEST_VAR).toBe("test_value");
            expect(env.ANOTHER_VAR).toBe("another_value");
        });

        it("should return a copy of the environment", () => {
            const env = provider.getAll();
            env.TEST_VAR = "modified";

            expect(provider.get("TEST_VAR")).toBe("test_value");
        });

        it("should include newly added environment variables", () => {
            vi.stubEnv("NEW_VAR", "new_value");
            const env = provider.getAll();

            expect(env.NEW_VAR).toBe("new_value");
        });
    });

    describe("has", () => {
        it("should return true for existing environment variables", () => {
            expect(provider.has("TEST_VAR")).toBe(true);
        });

        it("should return false for non-existent environment variables", () => {
            expect(provider.has("NON_EXISTENT")).toBe(false);
        });

        it("should return true for empty string values", () => {
            vi.stubEnv("EMPTY_VAR", "");
            expect(provider.has("EMPTY_VAR")).toBe(true);
        });

        it("should return false for null or undefined values", () => {
            vi.stubEnv("NULL_VAR", undefined);
            vi.stubEnv("UNDEFINED_VAR", undefined);

            expect(provider.has("NULL_VAR")).toBe(false);
            expect(provider.has("UNDEFINED_VAR")).toBe(false);
        });
    });
});
