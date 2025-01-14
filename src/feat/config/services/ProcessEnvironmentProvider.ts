/**
 * File: /src/features/config/services/EnvironmentProvider.ts
 * Provides access to environment variables with a testable interface
 */

import { Service } from "@tsed/di";

import { IEnvironmentProvider } from "../types/index.js";

/**
 * Service providing access to process environment variables
 * This implementation can be replaced with a mock for testing
 */
@Service()
export class ProcessEnvironmentProvider implements IEnvironmentProvider {
    /**
     * Gets the value of an environment variable
     * @param key - The environment variable key
     * @returns The value of the environment variable or undefined if not set
     */
    get(key: string): string | undefined {
        return process.env[key];
    }

    /**
     * Gets all environment variables
     * @returns Record of all environment variables
     */
    getAll(): Record<string, string | undefined> {
        return { ...process.env };
    }

    /**
     * Checks if an environment variable exists
     * @param key - The environment variable key
     * @returns true if the environment variable exists
     */
    has(key: string): boolean {
        return key in process.env;
    }
}
