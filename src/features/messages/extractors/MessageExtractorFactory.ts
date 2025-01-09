// MessageExtractorFactory.ts

import { IMessageExtractor } from "./IMessageExtractor.js";

/**
 * Factory class for creating message extractors.
 * Registers and provides message extractors based on the message type.
 */
export class MessageExtractorFactory {
    private extractors: Map<string, IMessageExtractor> = new Map();

    constructor() {
        this.registerDefaultExtractors();
    }

    /**
     * Registers the default message extractors.
     * Add new message extractors here as they are implemented.
     */
    private registerDefaultExtractors(): void {
        /* this.registerExtractor("pacs.008.001.09", new Pacs008MessageExtractor());
        this.registerExtractor("pacs.009.001.09", new Pacs009MessageExtractor()); */
    }

    /**
     * Registers a message extractor for a specific message type.
     * @param messageType The message type.
     * @param extractor The message extractor instance.
     */
    registerExtractor(messageType: string, extractor: IMessageExtractor): void {
        this.extractors.set(messageType, extractor);
    }

    /**
     * Gets the message extractor for a specific message type.
     * @param messageType The message type.
     * @returns The message extractor instance.
     * @throws {Error} If no message extractor is found for the given message type.
     */
    getExtractor(messageType: string): IMessageExtractor {
        const extractor = this.extractors.get(messageType);
        if (!extractor) {
            throw new Error(`No message extractor found for message type: ${messageType}`);
        }
        return extractor;
    }
}
