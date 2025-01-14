/**
 * File: /src/features/config/validation/validators.ts
 * Individual configuration validators
 */

import { BlockchainConfiguration, CoreConfiguration, LoggingConfiguration, MessagingConfiguration } from "../types/index.js";

/**
 * Validates core configuration settings
 * @param config Core configuration to validate
 * @throws {Error} If configuration is invalid
 */
export function validateCoreConfig(config: CoreConfiguration): void {
    if (!config) {
        throw new Error("Core configuration is required");
    }

    // Validate environment
    if (!["development", "staging", "production"].includes(config.environment)) {
        throw new Error("Invalid environment specified");
    }

    // Validate timeouts
    if (config.timeouts.defaultOperationTimeout <= 0) {
        throw new Error("Default operation timeout must be positive");
    }
    if (config.timeouts.maxOperationTimeout < config.timeouts.defaultOperationTimeout) {
        throw new Error("Max operation timeout must be greater than default timeout");
    }

    // Validate retry settings
    if (config.retry.defaultMaxAttempts < 0) {
        throw new Error("Max retry attempts must be non-negative");
    }
    if (config.retry.defaultRetryDelay < 0) {
        throw new Error("Retry delay must be non-negative");
    }

    // Validate metrics settings
    if (config.metrics.enabled) {
        if (config.metrics.collectionInterval < 100) {
            throw new Error("Metrics collection interval must be at least 100ms");
        }
        if (config.metrics.maxHistory < 1) {
            throw new Error("Metrics max history must be at least 1");
        }
    }
}

/**
 * Validates messaging configuration settings
 * @param config Messaging configuration to validate
 * @throws {Error} If configuration is invalid
 */
export function validateMessagingConfig(config: MessagingConfiguration): void {
    if (!config) {
        throw new Error("Messaging configuration is required");
    }

    // Validate pipeline configurations
    if (config.pipelines.validation.maxConcurrent < 1) {
        throw new Error("Validation pipeline max concurrent must be at least 1");
    }
    if (config.pipelines.transformation.maxConcurrent < 1) {
        throw new Error("Transformation pipeline max concurrent must be at least 1");
    }
    if (config.pipelines.processing.maxConcurrent < 1) {
        throw new Error("Processing pipeline max concurrent must be at least 1");
    }

    // Validate service configurations
    const msgService = config.services.messageProcessing;
    if (msgService.queue.maxSize < 1) {
        throw new Error("Message queue max size must be at least 1");
    }
    if (msgService.queue.processingTimeout < 1000) {
        throw new Error("Processing timeout must be at least 1000ms");
    }
}

/**
 * Validates blockchain configuration settings
 * @param config Blockchain configuration to validate
 * @throws {Error} If configuration is invalid
 */
export function validateBlockchainConfig(config: BlockchainConfiguration): void {
    if (!config) {
        throw new Error("Blockchain configuration is required");
    }

    // Validate network configuration
    if (!config.network.url) {
        throw new Error("Network URL is required");
    }
    if (config.network.chainId < 1) {
        throw new Error("Chain ID must be positive");
    }

    // Validate transaction configuration
    if (config.transaction.defaultGasLimit < 21000) {
        throw new Error("Gas limit must be at least 21000");
    }
    if (!/^\d+$/.test(config.transaction.maxGasPrice)) {
        throw new Error("Max gas price must be a valid number string");
    }
    if (config.transaction.confirmationBlocks < 1) {
        throw new Error("Confirmation blocks must be at least 1");
    }

    // Validate contract addresses if provided
    const addressRegex = /^0x[a-fA-F0-9]{40}$/;
    Object.entries(config.contracts).forEach(([name, address]) => {
        if (address && !addressRegex.test(address)) {
            throw new Error(`Invalid contract address for ${name}`);
        }
    });
}

/**
 * Validates logging configuration settings
 * @param config Logging configuration to validate
 * @throws {Error} If configuration is invalid
 */
export function validateLoggingConfig(config: LoggingConfiguration): void {
    if (!config) {
        throw new Error("Logging configuration is required");
    }

    // Validate log level
    if (!["error", "warn", "info", "debug", "trace"].includes(config.level)) {
        throw new Error("Invalid log level specified");
    }

    // Validate transports
    if (!config.transports || config.transports.length === 0) {
        throw new Error("At least one logging transport is required");
    }

    // Validate rotation settings if present
    if (config.rotation) {
        if (config.rotation.maxSize < 1024) {
            throw new Error("Log rotation max size must be at least 1024 bytes");
        }
        if (config.rotation.maxFiles < 1) {
            throw new Error("Log rotation max files must be at least 1");
        }
    }
}
