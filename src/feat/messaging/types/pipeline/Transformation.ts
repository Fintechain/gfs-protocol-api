import { Message, RawMessage } from "../message/index.js";
import { Pipeline, PipelineContext, PipelineStage } from "./Pipeline.js";

/**
 * Represents the input for a transformation stage.
 */
export interface TransformationStageInput {
    /**
     * The original RawMessage in its raw format.
     * This property remains unchanged throughout the transformation pipeline.
     */
    rawMessage: RawMessage;

    /**
     * A partial representation of the Message that is gradually built up
     * as the message passes through the transformation stages.
     * Each stage contributes to the construction of the final Message.
     */
    parsedMessage: Partial<Message>;
}

/**
 * Represents the output of a transformation stage.
 * It has the same structure as the TransformationStageInput.
 */
export interface TransformationStageOutput {
    /**
     * The original RawMessage in its raw format.
     * This property remains unchanged throughout the transformation pipeline.
     */
    rawMessage: RawMessage;

    /**
     * The updated partial representation of the Message after applying
     * the transformation logic of the current stage.
     * Each stage contributes to the construction of the final Message.
     */
    parsedMessage: Partial<Message>;
}

/**
 * Represents the context for the transformation pipeline.
 */
export interface TransformationPipelineContext extends PipelineContext<TransformationStageInput> {
    // Add transformation-specific properties or methods
}

/**
 * Represents a stage in the transformation pipeline.
 * Each stage performs a specific transformation task on the input message
 * and contributes to the construction of the final Message.
 */
export interface TransformationStage extends PipelineStage {
    /**
     * Transforms the input message based on the specific logic of the stage.
     * @param context The transformation pipeline context.
     * @returns A promise that resolves to the output of the transformation stage.
     */
    transform(context: TransformationPipelineContext): Promise<TransformationStageOutput>;
}

/**
 * Represents the transformation pipeline that executes a series of transformation stages.
 * The pipeline takes an RawMessage as input, applies the transformation stages in sequence,
 * and returns the fully transformed Message.
 */
export interface TransformationPipeline extends Pipeline<TransformationStage, TransformationPipelineContext> {
    /**
     * Executes the transformation pipeline on the given RawMessage.
     * @param context The transformation pipeline context.
     * @returns A promise that resolves to the fully transformed Message.
     */
    execute(context: TransformationPipelineContext): Promise<Message>;
}

/**
 * Represents a factory for creating transformation pipelines based on the message type.
 */
export interface TransformationPipelineFactory {
    /**
     * Creates a transformation pipeline for the given message type.
     * @param messageType The type of the ISO 20022 message.
     * @returns The transformation pipeline instance.
     */
    createTransformationPipeline(messageType: string): TransformationPipeline;
}
