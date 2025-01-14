/**
 * Common types for ISO20022
 */

/**
 * Represents an ISO 20022 message in XML format.
 * The actual structure of the message will depend on the specific message type.
 */
export type RawMessage = string;

/**
 * Represents the parsed and transformed version of an raw message.
 * This interface defines the common properties that all parsed messages should have.
 * Additional properties specific to each message type can be added as needed.
 */
export interface Message {
    /** The unique identifier of the message. */
    messageId: string;
    /** The type of the message, e.g., "pain.001.001.09", "pacs.008.001.08", etc. */
    messageType: string;
    /** The sender of the message. */
    sender: string;
    /** The recipient of the message. */
    recipient: string;
    /** The timestamp indicating when the message was created. */
    creationTimestamp: Date;
    // Add more common properties as needed
}
