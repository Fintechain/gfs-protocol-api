/**
 * File: /src/features/core/types/network/Adapter.ts
 * Core type definitions for financial messaging network adapters
 */

import { Message } from "../message/index.js";

/**
 * Represents the capabilities of a financial messaging network
 */
export interface NetworkCapabilities {
    /** Whether the network supports message cancellation */
    supportsCancellation: boolean;
    /** Whether the network supports message status queries */
    supportsStatusQuery: boolean;
    /** Whether the network supports message retry */
    supportsRetry: boolean;
    /** Whether the network supports cross-border messages */
    supportsCrossBorder: boolean;
    /** Maximum message size in bytes */
    maxMessageSize: number;
    /** Supported message types */
    supportedMessageTypes: string[];
}

/**
 * Base status for financial messages across different networks
 */
export type MessageStatus =
    | "PENDING" // Message is waiting to be processed
    | "PROCESSING" // Message is being processed
    | "DELIVERED" // Message has been delivered to recipient
    | "COMPLETED" // Message processing is complete
    | "FAILED" // Message processing has failed
    | "CANCELLED" // Message has been cancelled
    | "UNKNOWN"; // Message status cannot be determined

/**
 * Base submission result interface
 */
export interface SubmissionResult {
    /** Unique message identifier assigned by the network */
    messageId: string;
    /** Timestamp of submission */
    timestamp: Date;
    /** Current status of the message */
    status: MessageStatus;
    /** Network-specific response data */
    networkData?: Record<string, unknown>;
}

/**
 * Base message routing information
 */
export interface MessageRouting {
    /** Source institution identifier */
    source: string;
    /** Destination institution identifier */
    destination: string;
    /** Service level (e.g., 'URGENT', 'NORMAL') */
    serviceLevel?: string;
    /** Message priority */
    priority?: "HIGH" | "NORMAL" | "LOW";
}

/**
 * Base submission options interface
 */
export interface SubmissionOptions {
    /** Message routing information */
    routing: MessageRouting;
    /** Delivery notification required */
    requireNotification?: boolean;
    /** Timeout for message processing in milliseconds */
    timeout?: number;
    /** Network-specific options */
    networkOptions?: Record<string, unknown>;
}

/**
 * Core financial messaging network adapter interface
 */
export interface FinancialMessagingNetworkAdapter {
    /**
     * Gets the network identifier
     */
    readonly networkId: string;

    /**
     * Gets the capabilities of this network
     */
    getCapabilities(): NetworkCapabilities;

    /**
     * Submits a message to the financial network
     * @param message The parsed message to submit
     * @param options Submission options
     * @returns Promise resolving to submission result
     * @throws {NetworkSubmissionError} If submission fails
     */
    submitMessage(message: Message, options: SubmissionOptions): Promise<SubmissionResult>;

    /**
     * Gets the current status of a message
     * @param messageId The message identifier
     * @returns Promise resolving to message status
     * @throws {MessageQueryError} If status cannot be retrieved
     */
    getMessageStatus(messageId: string): Promise<MessageStatus>;

    /**
     * Cancels a message if supported by the network
     * @param messageId The message identifier
     * @returns Promise resolving to true if cancelled, false if not possible
     * @throws {MessageCancellationError} If cancellation fails
     */
    cancelMessage?(messageId: string): Promise<boolean>;

    /**
     * Attempts to retry a failed message if supported by the network
     * @param messageId The message identifier
     * @returns Promise resolving to true if retry initiated, false if not possible
     * @throws {MessageRetryError} If retry fails
     */
    retryMessage?(messageId: string): Promise<boolean>;
}

/**
 * Factory interface for creating network adapters
 */
export interface NetworkAdapterFactory {
    /**
     * Creates a network adapter instance
     * @param networkId The network identifier
     * @param config Network-specific configuration
     * @returns The created network adapter
     * @throws {AdapterCreationError} If adapter creation fails
     */
    createAdapter(networkId: string, config: Record<string, unknown>): FinancialMessagingNetworkAdapter;

    /**
     * Lists available network adapters
     * @returns Array of available network identifiers
     */
    getAvailableNetworks(): string[];
}
