/**
 * File: /src/features/config/validation/index.ts
 * Main validation entry point
 */

import { SystemConfiguration } from "../types/index.js";
import { validateBlockchainConfig, validateCoreConfig, validateLoggingConfig, validateMessagingConfig } from "./Validators.js";

/**
 * Validates the entire system configuration
 * @param config Configuration to validate
 * @throws {Error} If configuration is invalid
 */
export function validateConfiguration(config: SystemConfiguration): void {
    if (!config) {
        throw new Error("System configuration is required");
    }

    validateCoreConfig(config.core);
    validateMessagingConfig(config.messaging);
    validateBlockchainConfig(config.blockchain);
    validateLoggingConfig(config.logging);
}
