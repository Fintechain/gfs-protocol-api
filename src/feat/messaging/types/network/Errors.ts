/**
 * Base error class for network adapter operations
 */
export class NetworkAdapterError extends Error {
    constructor(
        message: string,
        public readonly networkId: string,
        public readonly code: string,
        public readonly details?: Record<string, unknown>
    ) {
        super(message);
        this.name = "NetworkAdapterError";
    }
}

/**
 * Error thrown when message submission fails
 */
export class NetworkSubmissionError extends NetworkAdapterError {
    constructor(
        networkId: string,
        message: string,
        code: string,
        public readonly messageId?: string,
        details?: Record<string, unknown>
    ) {
        super(message, networkId, code, details);
        this.name = "NetworkSubmissionError";
    }
}

/**
 * Error thrown when message query fails
 */
export class MessageQueryError extends NetworkAdapterError {
    constructor(
        networkId: string,
        message: string,
        code: string,
        public readonly messageId: string,
        details?: Record<string, unknown>
    ) {
        super(message, networkId, code, details);
        this.name = "MessageQueryError";
    }
}

/**
 * Error thrown when message cancellation fails
 */
export class MessageCancellationError extends NetworkAdapterError {
    constructor(
        networkId: string,
        message: string,
        code: string,
        public readonly messageId: string,
        details?: Record<string, unknown>
    ) {
        super(message, networkId, code, details);
        this.name = "MessageCancellationError";
    }
}

/**
 * Error thrown when message retry fails
 */
export class MessageRetryError extends NetworkAdapterError {
    constructor(
        networkId: string,
        message: string,
        code: string,
        public readonly messageId: string,
        details?: Record<string, unknown>
    ) {
        super(message, networkId, code, details);
        this.name = "MessageRetryError";
    }
}

/**
 * Error thrown when adapter creation fails
 */
export class AdapterCreationError extends NetworkAdapterError {
    constructor(networkId: string, message: string, code: string, details?: Record<string, unknown>) {
        super(message, networkId, code, details);
        this.name = "AdapterCreationError";
    }
}
