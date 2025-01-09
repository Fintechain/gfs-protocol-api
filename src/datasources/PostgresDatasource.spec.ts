// src/datasources/PostgresDatasource.spec.ts

import { Logger } from "@tsed/logger";
import { PlatformTest } from "@tsed/platform-http/testing";
import { DataSource } from "typeorm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PostgresDatasource, postgresDatasource } from "./PostgresDatasource.js";

// Mock typeorm before imports
vi.mock("typeorm", () => {
    return {
        DataSource: vi.fn().mockImplementation((config) => ({
            ...config,
            initialize: vi.fn().mockResolvedValue(undefined),
            isInitialized: true,
            close: vi.fn().mockResolvedValue(undefined)
        }))
    };
});

describe("PostgresDatasource", () => {
    let logger: Logger;
    let mockInitialize: jest.Mock;
    let mockClose: jest.Mock;

    beforeEach(async () => {
        // Reset mocks
        vi.clearAllMocks();

        // Create mock logger
        logger = {
            info: vi.fn(),
            error: vi.fn(),
            debug: vi.fn(),
            warn: vi.fn()
        } as any;

        // Setup mock methods
        mockInitialize = vi.fn().mockResolvedValue(undefined);
        mockClose = vi.fn().mockResolvedValue(undefined);

        // Mock the postgresDatasource initialize and close methods
        postgresDatasource.initialize = mockInitialize;
        postgresDatasource.close = mockClose;
        postgresDatasource.isInitialized = true;

        // Override providers
        await PlatformTest.create({
            imports: [
                {
                    token: Logger,
                    use: logger
                }
            ]
        });
    });

    afterEach(async () => {
        await PlatformTest.reset();
    });

    it("should initialize datasource successfully", async () => {
        const instance = await PlatformTest.invoke<DataSource>(PostgresDatasource);

        expect(instance).toBeDefined();
        expect(mockInitialize).toHaveBeenCalled();
        expect(logger.info).toHaveBeenCalledWith("Connected with typeorm to database: Postgres");
    });

    it("should handle initialization errors", async () => {
        const error = new Error("Connection failed");
        mockInitialize.mockRejectedValueOnce(error);

        await expect(PlatformTest.invoke<DataSource>(PostgresDatasource)).rejects.toThrow(error);
    });

    it("should cleanup on destroy", async () => {
        const instance = await PlatformTest.invoke<DataSource>(PostgresDatasource);

        // Reset mocks to ensure we only capture the destroy call
        vi.clearAllMocks();

        await PlatformTest.reset();
        expect(mockClose).toHaveBeenCalled();
    });

    describe("Configuration", () => {
        const originalEnv = process.env;

        beforeEach(() => {
            // Reset env
            process.env = { ...originalEnv };
            // Clear specific environment variables
            delete process.env.POSTGRES_HOST;
            delete process.env.POSTGRES_PORT;
            delete process.env.POSTGRES_USER;
            delete process.env.POSTGRES_PASSWORD;
            delete process.env.POSTGRES_DB;
        });

        afterEach(() => {
            process.env = originalEnv;
        });

        it("should use default configuration", async () => {
            await PlatformTest.invoke<DataSource>(PostgresDatasource);

            expect(postgresDatasource).toEqual(
                expect.objectContaining({
                    type: "postgres",
                    host: "localhost",
                    port: 5432,
                    username: "test",
                    password: "test",
                    database: "test",
                    entities: expect.any(Array)
                })
            );
        });

        it("should use environment variables when provided", async () => {
            // Set environment variables
            process.env.POSTGRES_HOST = "test.host";
            process.env.POSTGRES_PORT = "5433";
            process.env.POSTGRES_USER = "admin";
            process.env.POSTGRES_PASSWORD = "secret";
            process.env.POSTGRES_DB = "testdb";

            // Need to re-import the module to use new env vars
            vi.resetModules();
            const { postgresDatasource: updatedDatasource } = await import("./PostgresDatasource.js");

            expect(updatedDatasource).toEqual(
                expect.objectContaining({
                    type: "postgres",
                    host: "test.host",
                    port: 5433,
                    username: "admin",
                    password: "secret",
                    database: "testdb",
                    entities: expect.any(Array)
                })
            );
        });
    });
});
