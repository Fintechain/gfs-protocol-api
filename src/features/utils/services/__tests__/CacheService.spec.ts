// src/features/utils/services/__tests__/CacheService.spec.ts

import { PlatformTest } from "@tsed/platform-http/testing";
import Redis from "ioredis";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CacheService } from "../CacheService.js";
import { LoggerService } from "../LoggerService.js";

// Create mock Redis instance with all required methods
const createMockRedis = () => {
    const listeners = new Map();
    return {
        ping: vi.fn().mockResolvedValue("PONG"),
        quit: vi.fn().mockResolvedValue(undefined),
        setex: vi.fn().mockResolvedValue("OK"),
        get: vi.fn().mockResolvedValue(null),
        del: vi.fn().mockResolvedValue(1),
        // Add event emitter functionality
        on: vi.fn((event, callback) => {
            if (!listeners.has(event)) {
                listeners.set(event, []);
            }
            listeners.get(event).push(callback);
        }),
        emit: vi.fn((event, ...args) => {
            if (listeners.has(event)) {
                listeners.get(event).forEach((callback: Function) => callback(...args));
            }
        })
    };
};

// Mock Redis
vi.mock("ioredis", () => ({
    default: vi.fn().mockImplementation(() => createMockRedis())
}));

describe("CacheService", () => {
    let service: CacheService;
    let redis: ReturnType<typeof createMockRedis>;
    let logger: LoggerService;

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

        // Create platform test instance
        await PlatformTest.create();

        // Create service instance
        service = new CacheService(logger);
        redis = (service as any).redis;
    });

    afterEach(async () => {
        await PlatformTest.reset();
    });

    describe("Lifecycle Methods", () => {
        describe("$beforeInit", () => {
            it("should initialize successfully", async () => {
                await service.$beforeInit();

                expect(redis.ping).toHaveBeenCalled();
                expect(logger.info).toHaveBeenCalledWith("Cache service initialized");
            });

            it("should throw error on initialization failure", async () => {
                const error = new Error("Connection failed");
                redis.ping.mockRejectedValueOnce(error);

                await expect(service.$beforeInit()).rejects.toThrow(error);
                expect(logger.error).toHaveBeenCalledWith("Failed to initialize cache service", { error });
            });

            it("should handle Redis connection errors", async () => {
                const connectionError = new Error("ECONNREFUSED");
                redis.ping.mockRejectedValueOnce(connectionError);

                await expect(service.$beforeInit()).rejects.toThrow(connectionError);
                expect(logger.error).toHaveBeenCalledWith("Failed to initialize cache service", { error: connectionError });
            });
        });

        describe("$onDestroy", () => {
            it("should cleanup resources", async () => {
                await service.$onDestroy();
                expect(redis.quit).toHaveBeenCalled();
            });

            it("should handle cleanup errors", async () => {
                const error = new Error("Cleanup failed");
                redis.quit.mockRejectedValueOnce(error);

                await expect(service.$onDestroy()).rejects.toThrow(error);
            });
        });
    });

    describe("Cache Operations", () => {
        describe("set", () => {
            it("should set cache value with default TTL", async () => {
                const key = "test-key";
                const value = { data: "test" };

                await service.set(key, value);

                expect(redis.setex).toHaveBeenCalledWith(key, 3600, JSON.stringify(value));
                expect(logger.debug).toHaveBeenCalledWith("Cache set", { key, ttl: 3600 });
            });

            it("should set cache value with custom TTL", async () => {
                const key = "test-key";
                const value = { data: "test" };
                const ttl = 1800;

                await service.set(key, value, { ttl });

                expect(redis.setex).toHaveBeenCalledWith(key, ttl, JSON.stringify(value));
            });

            it("should handle set errors", async () => {
                const error = new Error("Set failed");
                redis.setex.mockRejectedValueOnce(error);

                const key = "test-key";
                await expect(service.set(key, "value")).rejects.toThrow(error);
                expect(logger.error).toHaveBeenCalledWith("Cache set failed", { key, error });
            });

            it("should handle invalid values", async () => {
                const key = "test-key";
                const circularRef: any = {};
                circularRef.self = circularRef;

                await expect(service.set(key, circularRef)).rejects.toThrow();
                expect(logger.error).toHaveBeenCalledWith("Cache set failed", expect.any(Object));
            });
        });

        describe("get", () => {
            it("should return null for non-existent key", async () => {
                redis.get.mockResolvedValueOnce(null);

                const result = await service.get("non-existent");
                expect(result).toBeNull();
            });

            it("should return parsed value for existing key", async () => {
                const value = { data: "test" };
                redis.get.mockResolvedValueOnce(JSON.stringify(value));

                const result = await service.get("test-key");
                expect(result).toEqual(value);
            });

            it("should handle get errors", async () => {
                const error = new Error("Get failed");
                redis.get.mockRejectedValueOnce(error);

                const key = "test-key";
                await expect(service.get(key)).rejects.toThrow(error);
                expect(logger.error).toHaveBeenCalledWith("Cache get failed", { key, error });
            });

            it("should handle invalid JSON", async () => {
                redis.get.mockResolvedValueOnce("invalid-json");

                const key = "test-key";
                const result = await service.get(key);
                expect(result).toBeNull();
                expect(logger.warn).toHaveBeenCalledWith("Failed to parse cached value", {
                    key,
                    error: expect.any(Error)
                });
            });
        });

        describe("del", () => {
            it("should delete cache key", async () => {
                const key = "test-key";

                await service.del(key);

                expect(redis.del).toHaveBeenCalledWith(key);
                expect(logger.debug).toHaveBeenCalledWith("Cache deleted", { key });
            });

            it("should handle delete errors", async () => {
                const error = new Error("Delete failed");
                redis.del.mockRejectedValueOnce(error);

                const key = "test-key";
                await expect(service.del(key)).rejects.toThrow(error);
                expect(logger.error).toHaveBeenCalledWith("Cache delete failed", { key, error });
            });

            it("should handle non-existent key deletion", async () => {
                redis.del.mockResolvedValueOnce(0);
                const key = "non-existent";

                await service.del(key);
                expect(logger.debug).toHaveBeenCalledWith("Cache deleted", { key });
            });
        });
    });

    describe("Configuration", () => {
        it("should use default Redis configuration", () => {
            expect(Redis).toHaveBeenCalledWith({
                host: "localhost",
                port: 6379,
                password: undefined,
                retryStrategy: expect.any(Function)
            });
        });

        it("should use environment variables for configuration", () => {
            process.env.REDIS_HOST = "redis.example.com";
            process.env.REDIS_PORT = "6380";
            process.env.REDIS_PASSWORD = "secret";

            new CacheService(logger);

            expect(Redis).toHaveBeenCalledWith({
                host: "redis.example.com",
                port: 6380,
                password: "secret",
                retryStrategy: expect.any(Function)
            });
        });

        it("should handle retry strategy", () => {
            const service = new CacheService(logger);
            const retryStrategy = (Redis as any).mock.calls[0][0].retryStrategy;

            expect(retryStrategy(1)).toBe(50); // First retry
            expect(retryStrategy(10)).toBe(500); // 10th retry
            expect(retryStrategy(100)).toBe(2000); // Max retry delay
        });
    });

    describe("Event Handling", () => {
        it("should handle Redis error events", () => {
            const error = new Error("Redis error");
            redis.emit("error", error);

            expect(logger.error).toHaveBeenCalledWith("Redis connection error", { error });
        });

        it("should handle Redis connect events", () => {
            redis.emit("connect");

            expect(logger.debug).toHaveBeenCalledWith("Redis connected");
        });
    });
});
