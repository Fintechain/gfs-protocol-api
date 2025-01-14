/**
 * File: /src/features/messaging/types/pipeline/Pipeline.ts
 * Contains messaging pipeline context type definitions that align with the messaging type system
 */

import { PipelineConfig } from "../../../config/types/Messaging.js";

/**
 * Represents the base context passed through pipeline stages.
 * Extends this for specific pipeline contexts (validation, transformation, processing).
 */
export interface PipelineContext<T> {
    /** The data being processed by the pipeline */
    data: T;
    /** Unique identifier for this pipeline execution */
    executionId: string;
    /** Pipeline metrics for monitoring execution */
    metrics: PipelineMetrics;
    /** Additional context metadata */
    metadata?: Record<string, unknown>;
}

/**
 * Common pipeline execution state information
 */
export interface PipelineState {
    /** Unique identifier for this pipeline execution */
    executionId: string;
    /** Current stage being executed */
    currentStage?: string;
    /** Number of stages completed */
    completedStages: number;
    /** Last error encountered if any */
    lastError?: Error;
    /** Start time of pipeline execution */
    startTime: Date;
    /** End time of pipeline execution */
    endTime?: Date;
}

/**
 * Represents an enhanced pipeline context with configuration and state
 */
export interface EnhancedPipelineContext<T> extends PipelineContext<T> {
    /** Pipeline configuration */
    config: PipelineConfig;
    /** Current pipeline state */
    state: PipelineState;
}

/**
 * Factory interface for creating pipeline contexts
 */
export interface PipelineContextFactory<T> {
    /**
     * Creates a new pipeline context
     * @param data The data to be processed
     * @param config Optional configuration overrides
     */
    createContext(data: T, config?: Partial<PipelineConfig>): EnhancedPipelineContext<T>;
}

/**
 * Represents metrics and timing information for pipeline execution monitoring
 */
export interface PipelineMetrics {
    /** Time when pipeline execution started */
    startTime: Date;
    /** Time when pipeline execution completed */
    endTime?: Date;
    /** Total execution duration in milliseconds */
    duration?: number;
    /** Detailed metrics for each pipeline stage */
    stageMetrics: Map<
        string,
        {
            startTime: Date;
            endTime?: Date;
            duration?: number;
            status: "pending" | "success" | "error";
        }
    >;
}

/**
 * Represents a pipeline for executing a series of stages.
 */
export interface Pipeline<T, C extends PipelineContext<any>> {
    /**
     * Adds a stage to the pipeline.
     * @param stage The stage to be added.
     */
    addStage(stage: T): void;

    /**
     * Removes a stage from the pipeline.
     * @param stage The stage to be removed.
     */
    removeStage(stage: T): void;

    /**
     * Executes the pipeline by running each stage in sequence.
     * @param context The context to be processed by the pipeline.
     * @returns A promise that resolves to the final output of the pipeline.
     */
    execute(context: C): Promise<any>;

    /**
     * Retrieves current pipeline execution metrics.
     * @returns The current pipeline metrics.
     */
    getMetrics(): PipelineMetrics;

    /**
     * Subscribes to pipeline metrics updates.
     * @param listener Callback function to receive metric updates.
     * @returns Unsubscribe function.
     */
    subscribe(listener: (metrics: PipelineMetrics) => void): () => void;
}

/**
 * Represents metadata about a pipeline stage, providing information about its
 * purpose, order, and dependencies.
 */
export interface PipelineStage {
    /** Unique identifier for the stage */
    id: string;
    /** Human-readable name of the stage */
    name: string;
    /** Detailed description of the stage's purpose and functionality */
    description: string;
    /** Execution order in the pipeline */
    order: number;
    /** IDs of stages that must complete before this stage can execute */
    dependencies?: string[];
}
