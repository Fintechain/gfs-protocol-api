// IMessageExtractor.ts

import { ProtocolSubmissionType } from "../models/Message.js";
import { MessageDetails } from "../types/Messages.js";

/**
 * Interface for message extractors.
 * Defines methods for extracting message details and getting the submission type.
 */
export interface IMessageExtractor {
    /**
     * Extracts relevant details from the parsed message based on the message type.
     * @param parsedMessage The parsed message object.
     * @returns The extracted message details.
     */
    extractDetails(parsedMessage: Record<string, any>): MessageDetails;

    /**
     * Gets the protocol submission type for the message.
     * @returns The protocol submission type.
     */
    getSubmissionType(): ProtocolSubmissionType;
}
