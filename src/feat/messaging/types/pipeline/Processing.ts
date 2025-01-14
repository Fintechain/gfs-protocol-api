import { Message } from "../message/index.js";
import { Pipeline, PipelineContext, PipelineStage } from "./Pipeline.js";

/**
 * Represents the context for the processing pipeline.
 */
export interface ProcessingPipelineContext extends PipelineContext<Message> {
    // Add processing-specific properties or methods
}

/**
 * Represents a stage in the processing pipeline.
 * Each processing stage performs a specific processing task on the parsed message.
 */
export interface ProcessingStage extends PipelineStage {
    /**
     * Processes the parsed message.
     * @param context The processing pipeline context.
     * @returns A promise that resolves to the processed message.
     */
    process(context: ProcessingPipelineContext): Promise<Message>;
}

/**
 * Represents a processing pipeline for executing processing stages.
 */
export interface ProcessingPipeline extends Pipeline<ProcessingStage, ProcessingPipelineContext> {
    /**
     * Executes the processing pipeline by running each processing stage in sequence.
     * @param context The processing pipeline context.
     * @returns A promise that resolves to the processed message.
     */
    execute(context: ProcessingPipelineContext): Promise<Message>;
}

/**
 * Represents a factory for creating processing pipelines based on the message type.
 */
export interface ProcessingPipelineFactory {
    /**
     * Creates a processing pipeline for the given message type.
     * @param messageType The type of the ISO 20022 message.
     * @returns The processing pipeline instance.
     */
    createProcessingPipeline(messageType: string): ProcessingPipeline;
}
