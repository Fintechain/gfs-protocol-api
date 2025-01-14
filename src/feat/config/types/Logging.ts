/**
 * File: /src/features/config/types/logging.types.ts
 * Logging configuration types
 */

/** Available log levels */
export type LogLevel = "error" | "warn" | "info" | "debug" | "trace";

/** Log transport types */
export type LogTransport = "console" | "file" | "http";

/**
 * Configuration for logging
 */
export interface LoggingConfiguration {
    /** Minimum log level to record */
    level: LogLevel;
    /** Whether to include timestamps */
    timestamp: boolean;
    /** Whether to include trace IDs */
    traceId: boolean;
    /** Transport configuration */
    transports: {
        /** Transport type */
        type: LogTransport;
        /** Transport-specific options */
        options: Record<string, unknown>;
    }[];
    /** Log rotation configuration */
    rotation?: {
        /** Maximum file size in bytes */
        maxSize: number;
        /** Maximum number of files */
        maxFiles: number;
        /** Whether to compress rotated logs */
        compress: boolean;
    };
}
