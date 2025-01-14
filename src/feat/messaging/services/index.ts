import { Message, RawMessage } from "../types/index.js";
import { SubmissionResult } from "../types/network/index.js";
import { ValidationResult } from "../types/validation/Validation.js";

/**
 * Represents a service for validating ISO 20022 messages.
 */
export interface ValidationService {
    /**
     * Validates an ISO 20022 message.
     * @param message The ISO 20022 message to be validated.
     * @returns A promise that resolves to the validation result.
     * @throws {Error} If an error occurs during the validation process.
     */
    validateMessage(message: RawMessage): Promise<ValidationResult>;
}

/**
 * Represents a service for transforming ISO 20022 messages into a parsed representation.
 */
export interface TransformationService {
    /**
     * Transforms an ISO 20022 message into a parsed representation.
     * @param message The ISO 20022 message to be transformed.
     * @returns A promise that resolves to the parsed message.
     * @throws {Error} If an error occurs during the transformation process.
     */
    transformMessage(message: RawMessage): Promise<Message>;
}

/**
 * Represents a service for processing parsed ISO 20022 messages.
 */
export interface ProcessingService {
    /**
     * Processes a parsed ISO 20022 message.
     * @param message The parsed ISO 20022 message to be processed.
     * @returns A promise that resolves to the processing result.
     * @throws {Error} If an error occurs during the processing.
     */
    processMessage(message: Message): Promise<ProcessingResult>;
}

/**
 * Represents a service for coordinating the end-to-end processing of ISO 20022 messages.
 */
export interface MessageProcessingService {
    /**
     * Processes an ISO 20022 message from start to finish.
     * @param message The ISO 20022 message to be processed.
     * @returns A promise that resolves to the processing result.
     * @throws {Error} If an error occurs during the processing.
     */
    processMessage(message: RawMessage): Promise<ProcessingResult>;
}

/**
 * Represents the result of processing an ISO 20022 message.
 */
export interface ProcessingResult {
    /** Indicates whether the processing was successful or not. */
    success: boolean;
    /** The processed message, if available. */
    processedMessage?: Message;
    /** The transaction response from the blockchain network, if available. */
    transactionResponse?: SubmissionResult;
    /** An array of error messages, if any. */
    errors?: string[];
}
