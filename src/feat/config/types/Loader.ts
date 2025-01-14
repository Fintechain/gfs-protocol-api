/**
 * File: /src/features/config/types/Loader.ts
 * Types and interfaces for the configuration loading system.
 * This module defines the core contracts for loading configuration from various sources.
 */

import { SystemConfiguration } from "./index.js";

/**
 * Interface for configuration loaders.
 * Implement this interface to create new configuration sources.
 *
 * @example
 * ```typescript
 * class RedisConfigLoader implements ConfigurationLoader {
 *   async load(): Promise<Partial<SystemConfiguration>> {
 *     // Implementation for loading config from Redis
 *   }
 * }
 * ```
 */
export interface ConfigurationLoader {
    /**
     * Loads configuration from a source
     *
     * @returns Promise resolving to partial system configuration
     * @throws {Error} If loading fails
     */
    load(): Promise<Partial<SystemConfiguration>>;
}

/**
 * Supported configuration source types.
 * - 'file': JSON file-based configuration
 * - 'env': Environment variables
 * - 'defaults': Default configuration values
 */
export type ConfigSource = "file" | "env" | "defaults";

/**
 * Options for configuring the configuration loading process.
 *
 * @example
 * ```typescript
 * const options: LoadOptions = {
 *   sources: ['defaults', 'file', 'env'],
 *   configPath: './config/production.json',
 *   envPrefix: 'MYAPP_',
 *   validate: true
 * };
 * ```
 */
export interface LoadOptions {
    /**
     * Configuration sources to use in order of precedence.
     * Later sources override earlier ones.
     * @default ['defaults', 'file', 'env']
     */
    sources?: ConfigSource[];

    /**
     * Path to configuration file if using file source.
     * Required if 'file' is included in sources.
     * @example './config/production.json'
     */
    configPath?: string;

    /**
     * Environment variable prefix for env source.
     * Used to filter relevant environment variables.
     * @default 'APP_'
     * @example 'MYAPP_' will match 'MYAPP_CORE_ENVIRONMENT'
     */
    envPrefix?: string;

    /**
     * Whether to validate configuration after loading.
     * @default true
     */
    validate?: boolean;
}

/**
 * Interface defining the contract for environment variable access
 */
export interface IEnvironmentProvider {
    /**
     * Gets the value of an environment variable
     * @param key - The environment variable key
     * @returns The value of the environment variable or undefined if not set
     */
    get(key: string): string | undefined;

    /**
     * Gets all environment variables
     * @returns Record of all environment variables
     */
    getAll(): Record<string, string | undefined>;

    /**
     * Checks if an environment variable exists
     * @param key - The environment variable key
     * @returns true if the environment variable exists
     */
    has(key: string): boolean;
}
