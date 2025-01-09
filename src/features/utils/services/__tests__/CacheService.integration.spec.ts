// src/features/utils/services/__tests__/CacheService.integration.spec.ts

import { PlatformTest } from "@tsed/platform-http/testing";
import { GenericContainer, StartedTestContainer } from "testcontainers";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { CacheService } from "../CacheService.js";
import { LoggerService } from "../LoggerService.js";

describe("CacheService Integration", () => {
    let redisContainer: StartedTestContainer;
    let service: CacheService;
    let logger: LoggerService;
    let originalEnv: NodeJS.ProcessEnv;

    beforeAll(async () => {
        console.log("Starting Redis container...");

        // Store original env
        originalEnv = { ...process.env };

        try {
            // Start Redis container
            redisContainer = await new GenericContainer("redis:7-alpine")
                .withExposedPorts(6379)
                .withStartupTimeout(120000) // 2 minute timeout
                .start();

            console.log("Redis container started successfully");
            console.log(`Host: ${redisContainer.getHost()}`);
            console.log(`Port: ${redisContainer.getMappedPort(6379)}`);

            // Set environment variables for Redis connection
            process.env.REDIS_HOST = redisContainer.getHost();
            process.env.REDIS_PORT = redisContainer.getMappedPort(6379).toString();

            // Initialize platform and services
            await PlatformTest.create();
            logger = PlatformTest.get<LoggerService>(LoggerService);
            service = new CacheService(logger);

            // Initialize service
            await service.$beforeInit();
        } catch (error) {
            console.error("Error during setup:", error);
            throw error;
        }
    }, 150000); // 2.5 minute timeout for the entire setup

    afterAll(async () => {
        console.log("Starting cleanup...");
        try {
            // Restore original env
            process.env = originalEnv;

            // Cleanup
            if (service) {
                await service.$onDestroy();
            }

            if (redisContainer) {
                await redisContainer.stop();
                console.log("Redis container stopped successfully");
            }

            await PlatformTest.reset();
        } catch (error) {
            console.error("Error during cleanup:", error);
            throw error;
        }
    });

    describe("Basic Cache Operations", () => {
        it("should set and get cache value", async () => {
            const key = "test-key";
            const value = { data: "test-value", timestamp: Date.now() };

            // Set value
            await service.set(key, value);

            // Get value
            const retrieved = await service.get<typeof value>(key);
            expect(retrieved).toEqual(value);
        });

        it("should handle TTL correctly", async () => {
            const key = "ttl-test";
            const value = { data: "expires-soon" };

            // Set value with 1 second TTL
            await service.set(key, value, { ttl: 1 });

            // Value should exist initially
            const immediate = await service.get<typeof value>(key);
            expect(immediate).toEqual(value);

            // Wait for expiration
            await new Promise((resolve) => setTimeout(resolve, 1500));

            // Value should be null after expiration
            const expired = await service.get<typeof value>(key);
            expect(expired).toBeNull();
        });
    });

    describe("Error Handling", () => {
        it("should handle non-existent keys", async () => {
            const result = await service.get("non-existent-key");
            expect(result).toBeNull();
        });

        it("should handle invalid JSON", async () => {
            const key = "invalid-json-test";

            // Directly set invalid JSON using Redis client
            await (service as any).redis.set(key, "invalid-json");

            const result = await service.get(key);
            expect(result).toBeNull();
        });
    });
});
