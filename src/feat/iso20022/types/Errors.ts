/**
 * File: /src/features/messaging/types/errors.types.ts
 * Contains error type definitions for the messaging system
 */

/**
 * Base error class for all messaging-related errors
 */
export abstract class MessagingError extends Error {
    /** Error code for categorization */
    readonly code: string;
    /** Timestamp when the error occurred */
    readonly timestamp: Date;
    /** Whether the error is retryable */
    readonly retryable: boolean;
    /** Correlation ID for tracking the error across the system */
    readonly correlationId: string;

    constructor(message: string, code: string, retryable = false) {
        super(message);
        this.name = this.constructor.name;
        this.code = code;
        this.timestamp = new Date();
        this.retryable = retryable;
        this.correlationId = this.generateCorrelationId();
    }

    private generateCorrelationId(): string {
        return `${this.code}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Creates a structured error object for logging or transmission
     */
    toJSON(): Record<string, unknown> {
        return {
            name: this.name,
            message: this.message,
            code: this.code,
            timestamp: this.timestamp,
            retryable: this.retryable,
            correlationId: this.correlationId,
            stack: this.stack
        };
    }
}

/**
 * Errors related to message validation
 */
export class ValidationError extends MessagingError {
    /** Field path where validation failed */
    readonly field?: string;
    /** Validation rule that failed */
    readonly rule?: string;
    /** Expected value or format */
    readonly expected?: unknown;
    /** Actual value that failed validation */
    readonly actual?: unknown;

    constructor(
        message: string,
        code: string,
        details: {
            field?: string;
            rule?: string;
            expected?: unknown;
            actual?: unknown;
        }
    ) {
        super(message, `VALIDATION_${code}`, false);
        this.field = details.field;
        this.rule = details.rule;
        this.expected = details.expected;
        this.actual = details.actual;
    }

    toJSON(): Record<string, unknown> {
        return {
            ...super.toJSON(),
            field: this.field,
            rule: this.rule,
            expected: this.expected,
            actual: this.actual
        };
    }
}

/**
 * Errors related to message transformation
 */
export class TransformationError extends MessagingError {
    /** Stage where transformation failed */
    readonly stage: string;
    /** Source field/path in the original message */
    readonly sourcePath?: string;
    /** Target field/path in the transformed message */
    readonly targetPath?: string;

    constructor(
        message: string,
        code: string,
        details: {
            stage: string;
            sourcePath?: string;
            targetPath?: string;
        }
    ) {
        super(message, `TRANSFORM_${code}`, true);
        this.stage = details.stage;
        this.sourcePath = details.sourcePath;
        this.targetPath = details.targetPath;
    }

    toJSON(): Record<string, unknown> {
        return {
            ...super.toJSON(),
            stage: this.stage,
            sourcePath: this.sourcePath,
            targetPath: this.targetPath
        };
    }
}

/**
 * Errors related to message processing
 */
export class ProcessingError extends MessagingError {
    /** Processing phase where the error occurred */
    readonly phase: string;
    /** Transaction ID if available */
    readonly transactionId?: string;
    /** Technical error details */
    readonly technicalDetails?: Record<string, unknown>;

    constructor(
        message: string,
        code: string,
        details: {
            phase: string;
            transactionId?: string;
            technicalDetails?: Record<string, unknown>;
        },
        retryable = true
    ) {
        super(message, `PROCESSING_${code}`, retryable);
        this.phase = details.phase;
        this.transactionId = details.transactionId;
        this.technicalDetails = details.technicalDetails;
    }

    toJSON(): Record<string, unknown> {
        return {
            ...super.toJSON(),
            phase: this.phase,
            transactionId: this.transactionId,
            technicalDetails: this.technicalDetails
        };
    }
}

/**
 * File: /src/features/blockchain/types/errors.types.ts
 * Contains blockchain-specific error types
 */

export class BlockchainError extends MessagingError {
    /** Network ID where the error occurred */
    readonly networkId: string;
    /** Block number if available */
    readonly blockNumber?: number;
    /** Gas-related information */
    readonly gasInfo?: {
        gasUsed?: number;
        gasLimit?: number;
        gasPrice?: string;
    };

    constructor(
        message: string,
        code: string,
        details: {
            networkId: string;
            blockNumber?: number;
            gasInfo?: {
                gasUsed?: number;
                gasLimit?: number;
                gasPrice?: string;
            };
        },
        retryable = true
    ) {
        super(message, `BLOCKCHAIN_${code}`, retryable);
        this.networkId = details.networkId;
        this.blockNumber = details.blockNumber;
        this.gasInfo = details.gasInfo;
    }

    toJSON(): Record<string, unknown> {
        return {
            ...super.toJSON(),
            networkId: this.networkId,
            blockNumber: this.blockNumber,
            gasInfo: this.gasInfo
        };
    }
}

/**
 * Error mapper utility type
 */
export type ErrorMapper<T extends MessagingError> = (error: unknown) => T;

/**
 * Error handler function type
 */
export type ErrorHandler<T extends MessagingError> = (error: T) => Promise<void>;
