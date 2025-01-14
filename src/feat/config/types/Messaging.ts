/**
 * File: /src/features/config/types/messaging.types.ts
 * Messaging feature configuration types
 */

/**
 * Common configuration options for pipeline execution
 */
export interface PipelineConfig {
    /** Maximum number of concurrent validations */
    maxConcurrent: number;
    /** Whether to cache validation results */
    cacheResults: boolean;
    /** Cache TTL in milliseconds */
    cacheTTL?: number;
    /** Whether to stop execution on first error */
    failFast?: boolean;
    /** Maximum number of retry attempts */
    maxRetries?: number;
    /** Delay between retries in milliseconds */
    retryDelayMs?: number;
    /** Optional timeout for pipeline execution */
    timeoutMs?: number;
}

/**
 * Configuration for the messaging feature
 */
export interface MessagingConfiguration {
    /** Pipeline configurations */
    pipelines: {
        /** Validation pipeline configuration */
        validation: PipelineConfig;
        /** Transformation pipeline configuration */
        transformation: PipelineConfig;
        /** Processing pipeline configuration */
        processing: PipelineConfig;
    };
    /** Service configurations */
    services: {
        /** Message processing service configuration */
        messageProcessing: {
            /** Queue configuration */
            queue: {
                /** Maximum queue size */
                maxSize: number;
                /** Processing timeout in milliseconds */
                processingTimeout: number;
            };
            /** Circuit breaker configuration */
            circuitBreaker: {
                /** Failure threshold before opening */
                failureThreshold: number;
                /** Reset timeout in milliseconds */
                resetTimeout: number;
            };
        };
    };
}
