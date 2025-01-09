// src/features/utils/services/ConfigService.ts

import { Service } from "@tsed/di";
import { BeforeInit } from "@tsed/platform-http";
import * as dotenv from "dotenv";
import { readFile } from "fs/promises";
import { get as getPath } from "lodash";
import { join } from "path";

import { LoggerService } from "./LoggerService.js";

interface ConfigData {
    [key: string]: any;
}

@Service()
export class ConfigService implements BeforeInit {
    private config: ConfigData = {};
    private initialized = false;

    constructor(private logger: LoggerService) {}

    /**
     * Initialize configuration service
     */
    async $beforeInit(): Promise<void> {
        if (!this.initialized) {
            await this.loadConfig();
            this.initialized = true;
        }
    }

    /**
     * Get a configuration value
     * @param key Configuration key (supports dot notation)
     * @param defaultValue Default value if key not found
     */
    get<T>(key: string, defaultValue?: T): T {
        const value = getPath(this.config, key);
        if (value === undefined && defaultValue === undefined) {
            throw new Error(`Configuration key "${key}" not found`);
        }
        return (value ?? defaultValue) as T;
    }

    /**
     * Load configuration from files and environment
     */
    private async loadConfig(): Promise<void> {
        try {
            // Load .env file
            dotenv.config();

            // Load configuration file if exists
            try {
                const configPath = join(process.cwd(), "config", "config.json");
                const configFile = await readFile(configPath, "utf-8");

                try {
                    const fileConfig = JSON.parse(configFile);
                    this.config = { ...this.config, ...this.flattenObject(fileConfig) };
                } catch (parseError) {
                    this.logger.error("Failed to parse configuration file", { error: parseError });
                    throw new Error("Invalid configuration file format");
                }
            } catch (error) {
                // Only warn for file not found errors
                if ((error as any).code === "ENOENT") {
                    this.logger.warn("No config file found, using environment variables only");
                } else {
                    throw error;
                }
            }

            // Add environment variables
            this.config = {
                ...this.config,
                ...process.env,
                // Re-add flattened config to ensure nested properties aren't overwritten
                ...this.flattenObject(this.config)
            };

            this.logger.info("Configuration loaded successfully");
        } catch (error) {
            this.logger.error("Failed to load configuration", { error });
            throw error;
        }
    }

    /**
     * Flattens a nested object with dot notation
     * @param obj Object to flatten
     * @param prefix Key prefix for nested properties
     * @returns Flattened object
     */
    private flattenObject(obj: Record<string, any>, prefix = ""): Record<string, any> {
        return Object.keys(obj).reduce((acc: Record<string, any>, key: string) => {
            const prefixedKey = prefix ? `${prefix}.${key}` : key;

            if (typeof obj[key] === "object" && obj[key] !== null && !Array.isArray(obj[key])) {
                Object.assign(acc, this.flattenObject(obj[key], prefixedKey));
            } else {
                acc[prefixedKey] = obj[key];
            }

            return acc;
        }, {});
    }
}
