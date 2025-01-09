// src/features/messages/dtos/MessageDTO.ts

import { MessageStatus } from "../models/Message.js";
import { MessageHistory, MessageHistoryEvent, MessageTrackingResult, TransactionEvent } from "./Messages.js";

/**
 * DTO for submitting a new message
 */
export class SubmitMessageDTO {
    /** ISO20022 XML message content */
    xml: string;

    /** Optional submission configuration */
    options?: {
        priority?: "high" | "normal" | "low";
        timeoutSeconds?: number;
        retryAttempts?: number;
    };

    constructor(xml: string, options?: { priority?: "high" | "normal" | "low"; timeoutSeconds?: number; retryAttempts?: number }) {
        this.xml = xml;
        this.options = options;
    }
}

/**
 * Response for message submission
 */
export class SubmitMessageResponse {
    /** Unique identifier for the submitted message */
    messageId: string;

    /** Current status of the message */
    status: string;

    /** Transaction hash from the protocol */
    transactionHash: string;

    constructor(messageId: string, status: string, transactionHash: string) {
        this.messageId = messageId;
        this.status = status;
        this.transactionHash = transactionHash;
    }
}

/**
 * DTO for retrying a failed message
 */
export class RetryMessageDTO {
    /** Optional retry configuration */
    options?: {
        priority?: "high" | "normal" | "low";
        timeoutSeconds?: number;
        retryAttempts?: number;
    };

    constructor(options?: { priority?: "high" | "normal" | "low"; timeoutSeconds?: number; retryAttempts?: number }) {
        this.options = options;
    }
}

/**
 * Response for message retry operation
 */
export class RetryResponse {
    /** Original message ID */
    messageId: string;

    /** New transaction hash for the retry attempt */
    newTransactionHash: string;

    /** Current status after retry */
    status: string;

    constructor(messageId: string, newTransactionHash: string, status: string) {
        this.messageId = messageId;
        this.newTransactionHash = newTransactionHash;
        this.status = status;
    }
}

/**
 * Response for message cancellation
 */
export class CancelResponse {
    /** Message ID that was cancelled */
    messageId: string;

    /** Final status after cancellation */
    status: string;

    /** Timestamp of when the cancellation was processed */
    cancelledAt: Date;

    constructor(messageId: string, status: string, cancelledAt: Date) {
        this.messageId = messageId;
        this.status = status;
        this.cancelledAt = cancelledAt;
    }
}

export class MessageTrackingResultResponse implements MessageTrackingResult {
    messageId: string;
    status: MessageStatus;
    details: {
        protocolMessageId?: string;
        transactionHash?: string;
        blockNumber?: string;
        blockTimestamp?: Date;
        settlementId?: string;
        protocolStatus?: string;
        settlementStatus?: string;
    };
    lastUpdated: Date;

    constructor(
        messageId: string,
        status: MessageStatus,
        details: {
            protocolMessageId?: string;
            transactionHash?: string;
            blockNumber?: string;
            blockTimestamp?: Date;
            settlementId?: string;
            protocolStatus?: string;
            settlementStatus?: string;
        },
        lastUpdated: Date
    ) {
        this.messageId = messageId;
        this.status = status;
        this.details = details;
        this.lastUpdated = lastUpdated;
    }
}

// MessageHistory Class
export class MessageHistoryResponse implements MessageHistory {
    messageId: string;
    currentStatus: MessageStatus;
    events: MessageHistoryEvent[];
    processingSteps: Array<{
        step: string;
        timestamp: Date;
        status: string;
        details?: Record<string, any>;
    }>;
    validations: Array<{
        timestamp: Date;
        type: string;
        result: string;
        details: Record<string, any>;
    }>;
    transactions: TransactionEvent[];

    constructor(
        messageId: string,
        currentStatus: MessageStatus,
        events: MessageHistoryEvent[],
        processingSteps: Array<{ step: string; timestamp: Date; status: string; details?: Record<string, any> }>,
        validations: Array<{ timestamp: Date; type: string; result: string; details: Record<string, any> }>,
        transactions: TransactionEvent[]
    ) {
        this.messageId = messageId;
        this.currentStatus = currentStatus;
        this.events = events;
        this.processingSteps = processingSteps;
        this.validations = validations;
        this.transactions = transactions;
    }
}

/**
 * DTO for message validation request
 */
export class ValidateMessageDTO {
    xml: string;

    /** Optional message type override */
    messageType?: string;

    /** Optional validation options */
    options?: {
        skipSchemaValidation?: boolean;
        skipBusinessRules?: boolean;
        skipProtocolValidation?: boolean;
    };

    constructor(xml: string, messageType?: string, options?: ValidateMessageDTO["options"]) {
        this.xml = xml;
        this.messageType = messageType;
        this.options = options;
    }
}

/**
 * Response for validation operation
 */
export class ValidationResultDTO {
    /** Overall validation status */
    isValid: boolean;

    /** Validation errors if any */
    errors: Array<{
        /** Error code */
        code: string;
        /** Error message */
        message: string;
        /** Error severity */
        severity: "ERROR";
        /** Field that failed validation */
        field?: string;
    }>;

    /** Validation warnings if any */
    warnings: Array<{
        /** Warning code */
        code: string;
        /** Warning message */
        message: string;
        /** Warning severity */
        severity: "WARNING";
        /** Field that triggered warning */
        field?: string;
    }>;

    constructor(isValid: boolean, errors: ValidationResultDTO["errors"] = [], warnings: ValidationResultDTO["warnings"] = []) {
        this.isValid = isValid;
        this.errors = errors;
        this.warnings = warnings;
    }
}
// src/features/messages/dtos/TransformationDTO.ts

/**
 * DTO for message transformation request
 */
export class TransformMessageDTO {
    /** XML content of the message to transform */
    xml: string;

    /** Target format to transform to */
    targetFormat: string;

    /** Optional transformation options */
    options?: {
        preserveOriginal?: boolean;
        validateTarget?: boolean;
        strict?: boolean;
    };

    constructor(xml: string, targetFormat: string, options?: TransformMessageDTO["options"]) {
        this.xml = xml;
        this.targetFormat = targetFormat;
        this.options = options;
    }
}

/**
 * Response for transformation operation
 */
export class TransformResultDTO {
    /** Whether transformation was successful */
    transformed: boolean;

    /** Original format of the message */
    sourceFormat: string;

    /** Target format the message was transformed to */
    targetFormat: string;

    /** The transformed message content */
    result: any;

    /** Additional metadata about the transformation */
    metadata: {
        transformationType: string;
        timestamp: Date;
    };

    constructor(
        transformed: boolean,
        sourceFormat: string,
        targetFormat: string,
        result: any,
        metadata: { transformationType: string; timestamp: Date }
    ) {
        this.transformed = transformed;
        this.sourceFormat = sourceFormat;
        this.targetFormat = targetFormat;
        this.result = result;
        this.metadata = metadata;
    }
}
