// src/features/messages/errors/index.ts

export class MessageError extends Error {
    constructor(
        message: string,
        public readonly cause?: Error
    ) {
        super(message);
        this.name = this.constructor.name;
    }
}

export class ISO20022ValidationError extends MessageError {
    constructor(
        message: string,
        public readonly errors?: Array<{ code: string; message: string }> | Error
    ) {
        super(message);
    }
}

export class ProtocolSubmissionError extends MessageError {
    constructor(
        message: string,
        public readonly cause?: Error
    ) {
        super(message);
    }
}

export class ValidationError extends MessageError {
    constructor(
        message: string,
        public readonly validationErrors?: Array<{ field: string; message: string }>
    ) {
        super(message);
    }
}

export class MessageProcessingError extends MessageError {
    constructor(
        message: string,
        public readonly details?: Record<string, any>
    ) {
        super(message);
    }
}

export class MessageTrackingError extends MessageError {
    constructor(
        message: string,
        public readonly messageId: string,
        cause?: Error
    ) {
        super(message, cause);
    }
}

export class EventProcessingError extends MessageError {
    constructor(
        message: string,
        public readonly eventType: string,
        cause?: Error
    ) {
        super(message, cause);
    }
}

export class TransformationError extends MessageError {
    constructor(
        message: string,
        public readonly cause?: Error,
        public readonly details?: {
            sourceFormat?: string;
            targetFormat?: string;
            validationErrors?: Array<{ field: string; message: string }>;
        }
    ) {
        super(message, cause);
    }
}
