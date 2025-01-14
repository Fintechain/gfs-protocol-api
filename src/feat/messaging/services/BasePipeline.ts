/**
 * File: /src/features/messaging/pipelines/BasePipeline.ts
 * Base implementation of the Pipeline interface that handles stage management,
 * metrics collection, dependency management, and error handling.
 */

import { PipelineConfig } from "../../config/types/index.js";
import { Pipeline, PipelineContext, PipelineMetrics, PipelineStage, PipelineState } from "../types/index.js";

/**
 * Base implementation of Pipeline interface that can be extended by specific pipeline types
 */
export abstract class BasePipeline<T extends PipelineStage, C extends PipelineContext<any>> implements Pipeline<T, C> {
    /** Stages registered in the pipeline */
    protected stages: Map<string, T> = new Map();
    /** Order of stage execution */
    protected executionOrder: string[] = [];
    /** Pipeline metrics */
    protected metrics: PipelineMetrics;
    /** Metric update listeners */
    protected metricListeners: Set<(metrics: PipelineMetrics) => void> = new Set();
    /** Pipeline configuration */
    protected config: PipelineConfig;
    /** Pipeline state */
    protected state: PipelineState;

    constructor(config: PipelineConfig) {
        this.config = config;
        this.metrics = this.initializeMetrics();
        this.state = this.initializeState();
    }

    /**
     * Adds a stage to the pipeline
     * @param stage Stage to add
     * @throws {PipelineError} If stage with same ID already exists
     */
    public addStage(stage: T): void {
        if (this.stages.has(stage.id)) {
            throw new PipelineError("DUPLICATE_STAGE", `Stage with ID ${stage.id} already exists`, this.state.executionId);
        }

        // Validate dependencies
        this.validateStageDependencies(stage);

        // Add stage and update execution order
        this.stages.set(stage.id, stage);
        this.updateExecutionOrder();
    }

    /**
     * Finds all stages that depend on a given stage
     * @param stageId ID of the stage to find dependents for
     * @returns Array of stage IDs that depend on the given stage
     */
    protected findDependentStages(stageId: string): string[] {
        const dependents: string[] = [];

        // Iterate through all stages
        for (const [currentId, stage] of this.stages.entries()) {
            // Check if the current stage depends on the target stage
            if (stage.dependencies?.includes(stageId)) {
                dependents.push(currentId);
            }
        }
        return dependents;
    }

    /**
     * Removes a stage from the pipeline
     * @param stage Stage to remove
     * @throws {PipelineError} If stage doesn't exist or has dependents
     */
    public removeStage(stage: T): void {
        if (!this.stages.has(stage.id)) {
            throw new PipelineError("STAGE_NOT_FOUND", `Stage with ID ${stage.id} not found`, this.state.executionId);
        }
        // Check if any stages depend on this one
        const dependents = this.findDependentStages(stage.id);
        if (dependents.length > 0) {
            throw new PipelineError(
                "STAGE_HAS_DEPENDENTS",
                `Cannot remove stage ${stage.id} as it has dependents: ${dependents.join(", ")}`,
                this.state.executionId
            );
        }
        // Remove stage and update execution order
        this.stages.delete(stage.id);
        this.updateExecutionOrder();
    }

    /**
     * Executes the pipeline with the given context
     * @param context Execution context
     * @returns Promise resolving to pipeline output
     * @throws {PipelineError} If execution fails
     */
    public async execute(context: C): Promise<any> {
        try {
            this.startExecution();

            for (const stageId of this.executionOrder) {
                const stage = this.stages.get(stageId)!;

                // Update state
                this.state.currentStage = stageId;
                this.updateMetrics();

                try {
                    // Check if dependencies are satisfied
                    await this.checkDependencies(stage);

                    // Execute stage with timeout if configured
                    const result = await this.executeStageWithTimeout(stage, context);

                    // Update stage metrics
                    this.updateStageMetrics(stageId, "success");

                    // Handle stop on first error if configured
                    if (!result && this.config.failFast) {
                        throw new PipelineError(
                            "STAGE_EXECUTION_FAILED",
                            `Stage ${stageId} failed and failFast is enabled`,
                            this.state.executionId
                        );
                    }
                } catch (error) {
                    this.updateStageMetrics(stageId, "error");
                    throw error;
                }
            }

            this.completeExecution();
            return context.data;
        } catch (error) {
            this.failExecution(error);
            throw error;
        }
    }

    /**
     * Gets current pipeline metrics
     */
    public getMetrics(): PipelineMetrics {
        return this.metrics;
    }

    /**
     * Subscribes to metric updates
     * @param listener Callback to receive metric updates
     * @returns Unsubscribe function
     */
    public subscribe(listener: (metrics: PipelineMetrics) => void): () => void {
        this.metricListeners.add(listener);
        return () => this.metricListeners.delete(listener);
    }

    /**
     * Validates stage dependencies
     * @param stage Stage to validate
     * @throws {PipelineError} If dependencies are invalid
     */
    protected validateStageDependencies(stage: T): void {
        if (!stage.dependencies?.length) return;

        for (const depId of stage.dependencies) {
            if (!this.stages.has(depId)) {
                throw new PipelineError(
                    "INVALID_DEPENDENCY",
                    `Stage ${stage.id} depends on non-existent stage ${depId}`,
                    this.state.executionId
                );
            }
        }

        // Check for circular dependencies
        if (this.hasCircularDependency(stage)) {
            throw new PipelineError("CIRCULAR_DEPENDENCY", `Stage ${stage.id} creates a circular dependency`, this.state.executionId);
        }
    }

    /**
     * Updates the execution order based on stage dependencies
     * @throws {PipelineError} If dependency resolution fails
     */
    protected updateExecutionOrder(): void {
        const visited = new Set<string>();
        const temp = new Set<string>();
        const order: string[] = [];

        const visit = (stageId: string) => {
            if (temp.has(stageId)) {
                throw new PipelineError(
                    "CIRCULAR_DEPENDENCY",
                    "Circular dependency detected during order resolution",
                    this.state.executionId
                );
            }
            if (visited.has(stageId)) return;

            temp.add(stageId);
            const stage = this.stages.get(stageId)!;

            if (stage.dependencies) {
                for (const depId of stage.dependencies) {
                    visit(depId);
                }
            }

            temp.delete(stageId);
            visited.add(stageId);
            order.push(stageId);
        };

        for (const stageId of this.stages.keys()) {
            if (!visited.has(stageId)) {
                visit(stageId);
            }
        }

        this.executionOrder = order;
    }

    /**
     * Checks for circular dependencies
     * @param stage Stage to check
     */
    protected hasCircularDependency(stage: T): boolean {
        const visited = new Set<string>();
        const temp = new Set<string>();

        const visit = (stageId: string): boolean => {
            if (temp.has(stageId)) return true;
            if (visited.has(stageId)) return false;

            temp.add(stageId);
            const currentStage = this.stages.get(stageId);

            if (currentStage?.dependencies) {
                for (const depId of currentStage.dependencies) {
                    if (visit(depId)) return true;
                }
            }

            temp.delete(stageId);
            visited.add(stageId);
            return false;
        };

        return visit(stage.id);
    }

    /**
     * Executes a stage with timeout if configured
     * @param stage Stage to execute
     * @param context Execution context
     */
    protected async executeStageWithTimeout(stage: T, context: C): Promise<any> {
        if (!this.config.timeoutMs) {
            return await this.executeStage(stage, context);
        }

        let timeoutId: NodeJS.Timeout;

        // Create the timeout promise
        const timeoutPromise = new Promise((_, reject) => {
            timeoutId = setTimeout(() => {
                reject(
                    new PipelineError(
                        "STAGE_TIMEOUT",
                        `Stage ${stage.id} execution timed out after ${this.config.timeoutMs}ms`,
                        this.state.executionId
                    )
                );
            }, this.config.timeoutMs);
        });

        try {
            // Race between execution and timeout
            return await Promise.race([this.executeStage(stage, context), timeoutPromise]);
        } finally {
            // Always clear the timeout
            clearTimeout(timeoutId!);
        }
    }

    /**
     * Executes a single stage
     * @param stage Stage to execute
     * @param context Execution context
     */
    protected abstract executeStage(stage: T, context: C): Promise<any>;

    /**
     * Checks if all dependencies for a stage are satisfied
     * @param stage Stage to check
     */
    protected async checkDependencies(stage: T): Promise<void> {
        if (!stage.dependencies?.length) return;

        for (const depId of stage.dependencies) {
            const depMetrics = this.metrics.stageMetrics.get(depId);
            if (!depMetrics || depMetrics.status !== "success") {
                throw new PipelineError(
                    "DEPENDENCY_NOT_SATISFIED",
                    `Stage ${stage.id} dependency ${depId} not satisfied`,
                    this.state.executionId
                );
            }
        }
    }

    /**
     * Initializes pipeline metrics
     */
    protected initializeMetrics(): PipelineMetrics {
        return {
            startTime: new Date(),
            stageMetrics: new Map()
        };
    }

    /**
     * Initializes pipeline state
     */
    protected initializeState(): PipelineState {
        return {
            executionId: this.generateExecutionId(),
            completedStages: 0,
            startTime: new Date()
        };
    }

    /**
     * Generates a unique execution ID
     */
    protected generateExecutionId(): string {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Updates stage metrics
     * @param stageId Stage identifier
     * @param status Stage status
     */
    protected updateStageMetrics(stageId: string, status: "success" | "error"): void {
        const metrics = this.metrics.stageMetrics.get(stageId) ?? {
            startTime: new Date(),
            status: "pending"
        };

        metrics.endTime = new Date();
        metrics.duration = metrics.endTime.getTime() - metrics.startTime.getTime();
        metrics.status = status;

        this.metrics.stageMetrics.set(stageId, metrics);
        this.updateMetrics();
    }

    /**
     * Updates pipeline metrics and notifies listeners
     */
    protected updateMetrics(): void {
        this.metrics.endTime = new Date();
        this.metrics.duration = this.metrics.endTime.getTime() - this.metrics.startTime.getTime();
        this.metricListeners.forEach((listener) => listener(this.metrics));
    }

    /**
     * Starts pipeline execution
     */
    protected startExecution(): void {
        this.state = this.initializeState();
        this.metrics = this.initializeMetrics();
    }

    /**
     * Completes pipeline execution
     */
    protected completeExecution(): void {
        this.state.endTime = new Date();
        this.updateMetrics();
    }

    /**
     * Fails pipeline execution
     * @param error Error that caused the failure
     */
    protected failExecution(error: any): void {
        this.state.lastError = error;
        this.state.endTime = new Date();
        this.updateMetrics();
    }
}

/**
 * Base error class for pipeline operations
 */
export class PipelineError extends Error {
    constructor(
        public readonly code: string,
        message: string,
        public readonly executionId: string
    ) {
        super(message);
        this.name = "PipelineError";
    }
}
