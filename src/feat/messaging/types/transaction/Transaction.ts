/**
 * File: /src/features/core/types/transaction/transaction.types.ts
 * Contains transaction type definitions aligned with the GFS Protocol
 */

/**
 * Represents a message submission to the GFS Protocol
 * Maps to IProtocolCoordinator.MessageSubmission
 */
export interface GfsMessageSubmission {
    /** Type of ISO20022 message (e.g., PACS.008) */
    messageType: string;
    /** Destination address for the message */
    target: string;
    /** Chain ID where the target is located */
    targetChain: number;
    /** Encoded ISO20022 message data */
    payload: string;
}

/**
 * Configuration for GFS Protocol transaction submission
 */
export interface GfsTransactionConfig {
    /** Base protocol fee */
    baseFee?: string;
    /** Message delivery fee */
    deliveryFee?: string;
    /** Gas limit for transaction */
    gasLimit?: number;
    /** Gas price in wei */
    gasPrice?: string;
    /** Nonce override */
    nonce?: number;
}

/**
 * Status of a message in the GFS Protocol
 */
export type GfsMessageStatus =
    | "PENDING" // Message submitted but not processed
    | "PROCESSING" // Message is being processed
    | "COMPLETED" // Message processing completed successfully
    | "FAILED" // Message processing failed
    | "CANCELLED" // Message was cancelled
    | "RETRYING"; // Message is being retried

/**
 * Represents the result of a message submission to GFS Protocol
 * Maps to the response from IProtocolCoordinator.submitMessage
 */
export interface GfsSubmissionResult {
    /** Unique message identifier from the protocol */
    messageId: string;
    /** Transaction hash of the submission */
    transactionHash: string;
    /** Current status of the message */
    status: GfsMessageStatus;
    /** Timestamp of submission */
    timestamp: Date;
    /** Protocol fees paid */
    fees: {
        /** Base protocol fee paid */
        baseFee: string;
        /** Delivery fee paid */
        deliveryFee: string;
        /** Total gas cost */
        gasCost?: string;
    };
}

/**
 * Represents detailed processing result from GFS Protocol
 * Maps to IProtocolCoordinator.getMessageResult
 */
export interface GfsProcessingResult {
    /** Whether processing was successful */
    success: boolean;
    /** Raw result data from processing */
    result: string;
    /** Additional processing metadata */
    metadata?: {
        /** Processing start time */
        startTime: Date;
        /** Processing completion time */
        endTime?: Date;
        /** Number of processing attempts */
        attempts: number;
        /** Error information if failed */
        error?: {
            /** Error code */
            code: string;
            /** Error message */
            message: string;
            /** Additional error details */
            details?: Record<string, unknown>;
        };
    };
}

/**
 * Represents a transaction request to the GFS Protocol
 */
export interface GfsTransactionRequest {
    /** Message submission details */
    submission: GfsMessageSubmission;
    /** Transaction configuration */
    config?: GfsTransactionConfig;
    /** Optional retry configuration */
    retry?: {
        /** Maximum retry attempts */
        maxAttempts: number;
        /** Delay between retries in milliseconds */
        retryDelayMs: number;
        /** Whether to use exponential backoff */
        exponentialBackoff: boolean;
    };
}

/**
 * Represents a transaction response from the GFS Protocol
 */
export interface GfsTransactionResponse {
    /** Message submission result */
    submission: GfsSubmissionResult;
    /** Processing result if available */
    processing?: GfsProcessingResult;
    /** Blockchain transaction details */
    transaction: {
        /** Transaction hash */
        hash: string;
        /** Block number where transaction was included */
        blockNumber?: number;
        /** Number of block confirmations */
        confirmations: number;
        /** Transaction status */
        status: "pending" | "confirmed" | "failed";
    };
}

/**
 * Interface for GFS Protocol transaction operations
 */
export interface IGfsTransactionOperations {
    /**
     * Submits a message to the GFS Protocol
     * @param request Transaction request details
     * @returns Promise resolving to transaction response
     */
    submitMessage(request: GfsTransactionRequest): Promise<GfsTransactionResponse>;

    /**
     * Gets the current fee quote for message submission
     * @param submission Message submission details
     * @returns Promise resolving to fee quote
     */
    getMessageFees(submission: GfsMessageSubmission): Promise<{
        baseFee: string;
        deliveryFee: string;
    }>;

    /**
     * Gets the current status and result of a message
     * @param messageId Message identifier
     * @returns Promise resolving to processing result
     */
    getMessageResult(messageId: string): Promise<GfsProcessingResult>;

    /**
     * Retries a failed message
     * @param messageId Message identifier
     * @param config Optional new transaction configuration
     * @returns Promise resolving to new transaction response
     */
    retryMessage(messageId: string, config?: GfsTransactionConfig): Promise<GfsTransactionResponse>;

    /**
     * Cancels a pending message
     * @param messageId Message identifier
     * @returns Promise resolving to cancellation success
     */
    cancelMessage(messageId: string): Promise<boolean>;
}
