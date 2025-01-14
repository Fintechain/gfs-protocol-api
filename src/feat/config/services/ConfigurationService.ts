/**
 * File: /src/features/config/loaders/ConfigurationService.ts
 * JSON file-based configuration loader implementation.
 */

import { Service } from "@tsed/di";
import { readFile } from "fs/promises";
import { join } from "path";

import { ConfigurationLoader, SystemConfiguration } from "../types/index.js";

/**
 * Configuration options for the JSON loader
 */
export interface ConfigurationServiceOptions {
    /** Path to the configuration directory */
    configPath: string;
    /** Current environment (development, staging, production) */
    environment: string;
}

/**
 * JSON Configuration Loader Service
 * Loads configuration from JSON files and caches the result.
 *
 * @implements {ConfigurationLoader}
 */
@Service()
export class ConfigurationService implements ConfigurationLoader {
    /** Cache for the loaded configuration */
    private configCache?: Partial<SystemConfiguration>;

    /** Path to the configuration file */
    private readonly configPath: string;

    /** Current environment */
    private readonly environment: string;

    /**
     * Creates a new JSON configuration loader
     * @param options - Configuration options for the loader
     */
    constructor(options: ConfigurationServiceOptions) {
        this.configPath = options.configPath;
        this.environment = options.environment;
    }

    /**
     * Loads configuration from JSON files.
     * First loads the default configuration, then overlays environment-specific configuration.
     * Caches the result for subsequent calls.
     *
     * @returns Promise resolving to the merged system configuration
     * @throws {Error} If config files cannot be read or parsed
     */
    async load(): Promise<Partial<SystemConfiguration>> {
        // Return cached configuration if available
        if (this.configCache) {
            return this.configCache;
        }

        try {
            // Load default configuration
            const defaultConfig = await this.loadJsonFile<Partial<SystemConfiguration>>(this.getDefaultConfigPath());

            // Load environment-specific configuration if available
            const envConfig = await this.loadEnvironmentConfig();

            // Merge configurations
            const mergedConfig = this.mergeConfigurations(defaultConfig, envConfig);

            // Cache the result
            this.configCache = mergedConfig;

            return mergedConfig;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            throw new Error(`Failed to load configuration: ${errorMessage}`);
        }
    }

    /**
     * Gets the currently loaded configuration.
     * If no configuration is loaded, loads it first.
     *
     * @returns Promise resolving to the current system configuration
     */
    async getConfig(): Promise<Partial<SystemConfiguration>> {
        return this.configCache ?? this.load();
    }

    /**
     * Force reloads the configuration from disk.
     * Useful when configuration files have changed.
     *
     * @returns Promise resolving to the freshly loaded configuration
     */
    async reloadConfig(): Promise<Partial<SystemConfiguration>> {
        this.configCache = undefined;
        return this.load();
    }

    /**
     * Loads a JSON file from the specified path
     *
     * @param path - Path to the JSON file
     * @returns Promise resolving to the parsed JSON content
     * @throws {Error} If file cannot be read or parsed
     */
    private async loadJsonFile<T>(path: string): Promise<T> {
        try {
            const content = await readFile(path, "utf-8");
            return JSON.parse(content) as T;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            throw new Error(`Failed to load JSON file ${path}: ${errorMessage}`);
        }
    }

    /**
     * Loads environment-specific configuration if available
     *
     * @returns Promise resolving to environment configuration or empty object
     */
    private async loadEnvironmentConfig(): Promise<Partial<SystemConfiguration>> {
        try {
            const envPath = this.getEnvironmentConfigPath();
            return await this.loadJsonFile<Partial<SystemConfiguration>>(envPath);
        } catch (error) {
            // Return empty object if environment config doesn't exist
            return {};
        }
    }

    /**
     * Gets the path to the default configuration file
     */
    private getDefaultConfigPath(): string {
        return join(process.cwd(), this.configPath);
    }

    /**
     * Gets the path to the environment-specific configuration file
     */
    private getEnvironmentConfigPath(): string {
        const dir = this.configPath.split("/").slice(0, -1).join("/");
        return join(process.cwd(), dir, `${this.environment}.json`);
    }

    /**
     * Deep merges two configuration objects.
     * Environment configuration takes precedence over default configuration.
     *
     * @param base - Base configuration object
     * @param override - Override configuration object
     * @returns Merged configuration object
     */
    private mergeConfigurations<T extends Record<string, any>>(base: T, override: Partial<T>): T {
        if (!override || Object.keys(override).length === 0) {
            return base;
        }

        const result = { ...base };

        for (const [key, value] of Object.entries(override)) {
            const baseValue = base[key];
            if (value && typeof value === "object" && !Array.isArray(value) && baseValue) {
                (result as any)[key] = this.mergeConfigurations(baseValue as Record<string, any>, value as Record<string, any>);
            } else {
                (result as any)[key] = value;
            }
        }

        return result as T;
    }
}
