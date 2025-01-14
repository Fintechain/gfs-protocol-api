/**
 * File: /src/features/config/types/core.types.ts
 * Core system configuration types
 */

/**
 * Configuration for core system functionality
 */
export interface CoreConfiguration {
    /** Environment name (e.g., 'production', 'staging') */
    environment: "development" | "staging" | "production";
    /** System-wide timeout settings */
    timeouts: {
        /** Default operation timeout in milliseconds */
        defaultOperationTimeout: number;
        /** Maximum operation timeout in milliseconds */
        maxOperationTimeout: number;
    };
    /** Retry configuration */
    retry: {
        /** Default number of retry attempts */
        defaultMaxAttempts: number;
        /** Default delay between retries in milliseconds */
        defaultRetryDelay: number;
        /** Whether to use exponential backoff by default */
        useExponentialBackoff: boolean;
    };
    /** Metric collection configuration */
    metrics: {
        /** Whether to collect detailed metrics */
        enabled: boolean;
        /** Metric collection interval in milliseconds */
        collectionInterval: number;
        /** Maximum metrics history to maintain */
        maxHistory: number;
    };
}
