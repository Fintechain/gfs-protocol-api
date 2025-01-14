import { ValidationPipelineFactory } from "../validation/Validation.js";
import { ProcessingPipelineFactory } from "./Processing.js";
import { TransformationPipelineFactory } from "./Transformation.js";

/**
 * Represents a registry for mapping message types to their corresponding pipeline factories.
 */
export interface MessageTypeRegistry {
    /**
     * Registers a message type with its corresponding pipeline factories.
     * @param messageType The type of the ISO 20022 message.
     * @param validationPipelineFactory The factory for creating validation pipelines for the message type.
     * @param transformationPipelineFactory The factory for creating transformation pipelines for the message type.
     * @param processingPipelineFactory The factory for creating processing pipelines for the message type.
     */
    registerMessageType(
        messageType: string,
        validationPipelineFactory: ValidationPipelineFactory,
        transformationPipelineFactory: TransformationPipelineFactory,
        processingPipelineFactory: ProcessingPipelineFactory
    ): void;

    /**
     * Retrieves the validation pipeline factory for the given message type.
     * @param messageType The type of the ISO 20022 message.
     * @returns The validation pipeline factory, or undefined if not found.
     */
    getValidationPipelineFactory(messageType: string): ValidationPipelineFactory | undefined;

    /**
     * Retrieves the transformation pipeline factory for the given message type.
     * @param messageType The type of the ISO 20022 message.
     * @returns The transformation pipeline factory, or undefined if not found.
     */
    getTransformationPipelineFactory(messageType: string): TransformationPipelineFactory | undefined;

    /**
     * Retrieves the processing pipeline factory for the given message type.
     * @param messageType The type of the ISO 20022 message.
     * @returns The processing pipeline factory, or undefined if not found.
     */
    getProcessingPipelineFactory(messageType: string): ProcessingPipelineFactory | undefined;
}
