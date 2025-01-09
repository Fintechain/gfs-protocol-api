// src/features/utils/services/__tests__/ConfigService.spec.ts

import { PlatformTest } from "@tsed/platform-http/testing";
import * as dotenv from "dotenv";
import * as fs from "fs/promises";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ConfigService } from "../ConfigService.js";
import { LoggerService } from "../LoggerService.js";

// Mock fs/promises
vi.mock("fs/promises", () => ({
    readFile: vi.fn()
}));

// Mock dotenv
vi.mock("dotenv", () => ({
    config: vi.fn()
}));

describe("ConfigService", () => {
    let service: ConfigService;
    let logger: LoggerService;

    beforeEach(async () => {
        // Reset mocks and environment
        vi.clearAllMocks();
        process.env = {};

        // Create mock logger
        logger = {
            info: vi.fn(),
            warn: vi.fn(),
            error: vi.fn()
        } as any;

        // Create test platform
        await PlatformTest.create();

        // Create service with mocked logger
        service = new ConfigService(logger);
    });

    afterEach(async () => {
        await PlatformTest.reset();
    });

    describe("Configuration Loading", () => {
        it("should load configuration from file and environment", async () => {
            const configData = {
                database: {
                    host: "localhost",
                    port: 5432,
                    credentials: {
                        username: "admin"
                    }
                }
            };

            (fs.readFile as any).mockResolvedValueOnce(JSON.stringify(configData));
            process.env.API_KEY = "test-key";
            process.env.DATABASE_PASSWORD = "secret";

            await service.$beforeInit();

            // Test flattened config access
            expect(service.get("database.host")).toBe("localhost");
            expect(service.get("database.port")).toBe(5432);
            expect(service.get("database.credentials.username")).toBe("admin");

            // Test environment variables
            expect(service.get("API_KEY")).toBe("test-key");
            expect(service.get("DATABASE_PASSWORD")).toBe("secret");

            // Verify logging
            expect(logger.info).toHaveBeenCalledWith("Configuration loaded successfully");
        });

        it("should handle missing configuration file", async () => {
            // Create an error with the correct code property
            const error = new Error("ENOENT: no such file or directory") as NodeJS.ErrnoException;
            error.code = "ENOENT";

            (fs.readFile as any).mockRejectedValueOnce(error);
            process.env.FALLBACK_CONFIG = "value";

            await service.$beforeInit();

            expect(logger.warn).toHaveBeenCalledWith("No config file found, using environment variables only");
            expect(service.get("FALLBACK_CONFIG")).toBe("value");
        });

        it("should handle invalid JSON in configuration file", async () => {
            (fs.readFile as any).mockResolvedValueOnce("invalid json");

            await expect(service.$beforeInit()).rejects.toThrow("Invalid configuration file format");
            expect(logger.error).toHaveBeenCalledWith(
                "Failed to parse configuration file",
                expect.objectContaining({
                    error: expect.any(Error)
                })
            );
        });

        it("should initialize only once", async () => {
            const configData = { key: "value" };
            (fs.readFile as any).mockResolvedValueOnce(JSON.stringify(configData));

            await service.$beforeInit();
            await service.$beforeInit();

            expect(fs.readFile).toHaveBeenCalledTimes(1);
            expect(dotenv.config).toHaveBeenCalledTimes(1);
        });
    });

    describe("Configuration Access", () => {
        beforeEach(async () => {
            const configData = {
                app: {
                    name: "test-app",
                    settings: {
                        timeout: 5000,
                        retries: 3
                    }
                }
            };

            (fs.readFile as any).mockResolvedValueOnce(JSON.stringify(configData));
            await service.$beforeInit();
        });

        it("should access nested configuration values", () => {
            expect(service.get("app.name")).toBe("test-app");
            expect(service.get("app.settings.timeout")).toBe(5000);
            expect(service.get("app.settings.retries")).toBe(3);
        });

        it("should return default value for missing keys", () => {
            const defaultValue = "default";
            expect(service.get("missing.key", defaultValue)).toBe(defaultValue);
        });

        it("should throw error for missing keys without default value", () => {
            expect(() => service.get("missing.key")).toThrow('Configuration key "missing.key" not found');
        });
    });

    describe("Environment Variables", () => {
        it("should prioritize environment variables over file configuration", async () => {
            const configData = {
                database: {
                    host: "localhost",
                    port: 5432
                }
            };

            (fs.readFile as any).mockResolvedValueOnce(JSON.stringify(configData));
            process.env.DATABASE_HOST = "override-host";

            await service.$beforeInit();

            expect(service.get("database.host")).toBe("localhost"); // Nested config
            expect(service.get("DATABASE_HOST")).toBe("override-host"); // Env variable
        });

        it("should handle empty environment", async () => {
            process.env = {};
            const configData = { key: "value" };

            (fs.readFile as any).mockResolvedValueOnce(JSON.stringify(configData));
            await service.$beforeInit();

            expect(service.get("key")).toBe("value");
        });
    });

    describe("Error Handling", () => {
        it("should handle dotenv failure", async () => {
            const dotenvError = new Error("dotenv error");
            (dotenv.config as any).mockImplementationOnce(() => {
                throw dotenvError;
            });

            await expect(service.$beforeInit()).rejects.toThrow();
            expect(logger.error).toHaveBeenCalledWith("Failed to load configuration", expect.objectContaining({ error: dotenvError }));
        });

        it("should handle file system errors", async () => {
            // Create a non-ENOENT file system error
            const error = new Error("filesystem error") as NodeJS.ErrnoException;
            error.code = "EPERM"; // Permission error

            (fs.readFile as any).mockRejectedValueOnce(error);

            await expect(service.$beforeInit()).rejects.toThrow("filesystem error");
            expect(logger.error).toHaveBeenCalledWith("Failed to load configuration", expect.objectContaining({ error }));
        });
    });
});
