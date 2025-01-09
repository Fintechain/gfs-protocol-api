// src/features/utils/services/CacheService.ts

import { OnDestroy, Service } from "@tsed/di";
import { BeforeInit } from "@tsed/platform-http";
import Redis from "ioredis";

import { LoggerService } from "./LoggerService.js";

interface CacheOptions {
    ttl?: number;
}

@Service()
export class CacheService implements BeforeInit, OnDestroy {
    private redis: Redis;
    private defaultTTL = 3600; // 1 hour
    private initialized = false;

    constructor(private logger: LoggerService) {
        this.redis = new Redis({
            host: process.env.REDIS_HOST || "localhost",
            port: parseInt(process.env.REDIS_PORT || "6379"),
            password: process.env.REDIS_PASSWORD,
            retryStrategy: this.createRetryStrategy()
        });

        // Handle Redis errors
        this.redis.on("error", (error: Error) => {
            this.logger.error("Redis connection error", { error });
        });

        this.redis.on("connect", () => {
            this.logger.debug("Redis connected");
        });
    }

    /**
     * Initialize cache service
     * @throws Error if Redis connection fails
     */
    async $beforeInit(): Promise<void> {
        if (this.initialized) {
            return;
        }

        try {
            await this.redis.ping();
            this.initialized = true;
            this.logger.info("Cache service initialized");
        } catch (error) {
            this.logger.error("Failed to initialize cache service", { error });
            throw error;
        }
    }

    /**
     * Clean up resources
     * @throws Error if cleanup fails
     */
    async $onDestroy(): Promise<void> {
        try {
            await this.redis.quit();
            this.initialized = false;
        } catch (error) {
            this.logger.error("Failed to cleanup cache service", { error });
            throw error;
        }
    }

    /**
     * Set a value in cache
     * @param key Cache key
     * @param value Value to cache
     * @param options Cache options
     * @throws Error if operation fails
     */
    async set(key: string, value: any, options?: CacheOptions): Promise<void> {
        try {
            // Validate key
            this.validateKey(key);

            // Serialize value
            const serializedValue = JSON.stringify(value);
            const ttl = options?.ttl || this.defaultTTL;

            await this.redis.setex(key, ttl, serializedValue);
            this.logger.debug("Cache set", { key, ttl });
        } catch (error) {
            this.logger.error("Cache set failed", { key, error });
            throw error;
        }
    }

    /**
     * Get a value from cache
     * @param key Cache key
     * @returns Cached value or null
     * @throws Error if operation fails
     */
    async get<T>(key: string): Promise<T | null> {
        try {
            // Validate key
            this.validateKey(key);

            const value = await this.redis.get(key);
            if (!value) return null;

            try {
                return JSON.parse(value) as T;
            } catch (error) {
                this.logger.warn("Failed to parse cached value", { key, error });
                return null;
            }
        } catch (error) {
            this.logger.error("Cache get failed", { key, error });
            throw error;
        }
    }

    /**
     * Delete a value from cache
     * @param key Cache key
     * @throws Error if operation fails
     */
    async del(key: string): Promise<void> {
        try {
            // Validate key
            this.validateKey(key);

            await this.redis.del(key);
            this.logger.debug("Cache deleted", { key });
        } catch (error) {
            this.logger.error("Cache delete failed", { key, error });
            throw error;
        }
    }

    /**
     * Creates Redis retry strategy
     * @returns Retry delay in milliseconds
     */
    private createRetryStrategy(): (retries: number) => number {
        return (times: number) => {
            // Calculate retry delay with exponential backoff
            const delay = Math.min(times * 50, 2000);
            this.logger.debug("Redis retry", { attempt: times, delay });
            return delay;
        };
    }

    /**
     * Validates cache key
     * @param key Cache key to validate
     * @throws Error if key is invalid
     */
    private validateKey(key: string): void {
        if (!key || typeof key !== "string") {
            throw new Error("Invalid cache key");
        }
    }
}
