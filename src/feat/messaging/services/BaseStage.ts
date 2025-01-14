/**
 * File: /src/features/messaging/stages/BaseStage.ts
 */
import { PipelineContext, PipelineStage } from "../types/pipeline/Pipeline.js";
import { PipelineError } from "./BasePipeline.js";

export interface StageConfig {
    timeoutMs?: number;
    maxRetries?: number;
    retryDelayMs?: number;
    useExponentialBackoff?: boolean;
    [key: string]: any;
}

export interface StageMetrics {
    startTime: Date;
    endTime?: Date;
    duration?: number;
    retryAttempts: number;
    status: "pending" | "success" | "error";
    error?: {
        code: string;
        message: string;
        details?: Record<string, unknown>;
    };
    custom?: Record<string, unknown>;
}

export abstract class BaseStage<T extends PipelineContext<any>> implements PipelineStage {
    protected metrics: StageMetrics;
    public readonly dependencies: string[] = [];
    private metricListeners: Set<(metrics: StageMetrics) => void> = new Set();

    constructor(
        public readonly id: string,
        public readonly name: string,
        public readonly description: string,
        public readonly order: number,
        protected readonly config: StageConfig = {}
    ) {
        this.validateConfiguration();
        this.metrics = this.initializeMetrics();
    }

    public addDependency(stageId: string): void {
        if (stageId === this.id) {
            throw new Error("Stage cannot depend on itself");
        }
        if (!this.dependencies.includes(stageId)) {
            this.dependencies.push(stageId);
        }
    }

    public removeDependency(stageId: string): void {
        const index = this.dependencies.indexOf(stageId);
        if (index !== -1) {
            this.dependencies.splice(index, 1);
        }
    }

    // In BaseStage.ts, modify the execute method:
    public async execute(context: T): Promise<any> {
        const startTime = new Date();
        this.startExecution(startTime);

        try {
            let result;
            let attempts = 0;
            let lastError: Error | null = null;

            while (attempts < (this.config.maxRetries ?? 0) + 1) {
                try {
                    if (attempts > 0) {
                        const delay = this.calculateRetryDelay(attempts);
                        await this.delay(delay);
                    }

                    result = await Promise.race([
                        this.executeStage(context),
                        new Promise((_, reject) => {
                            if (this.config.timeoutMs) {
                                setTimeout(() => {
                                    reject(new Error(`Stage execution timed out after ${this.config.timeoutMs}ms`));
                                }, this.config.timeoutMs);
                            }
                        })
                    ]);

                    const endTime = new Date();
                    this.completeExecution(startTime, endTime);
                    return result;
                } catch (error) {
                    lastError = error as Error;
                    attempts++;
                    this.updateMetrics({ retryAttempts: attempts - 1 });

                    if (attempts >= (this.config.maxRetries ?? 0) + 1) {
                        const endTime = new Date();
                        this.failExecution(lastError, startTime, endTime);
                        throw this.wrapError(lastError);
                    }
                }
            }

            // This should never be reached due to the throw in the if statement above
            const endTime = new Date();
            this.failExecution(lastError ?? new Error("Unknown error"), startTime, endTime);
            throw this.wrapError(lastError ?? new Error("Stage execution failed"));
        } catch (error) {
            const endTime = new Date();
            this.failExecution(error as Error, startTime, endTime);
            throw this.wrapError(error);
        }
    }

    // Remove the executeWithTimeout method as we've integrated its functionality into execute

    public subscribe(listener: (metrics: StageMetrics) => void): () => void {
        this.metricListeners.add(listener);
        return () => this.metricListeners.delete(listener);
    }

    public getMetrics(): StageMetrics {
        return { ...this.metrics };
    }

    protected abstract executeStage(context: T): Promise<any>;

    protected validateConfiguration(): void {
        if (this.config.timeoutMs && this.config.timeoutMs <= 0) {
            throw new Error("Timeout must be greater than 0");
        }
        if (this.config.maxRetries && this.config.maxRetries < 0) {
            throw new Error("Max retries must be non-negative");
        }
        if (this.config.retryDelayMs && this.config.retryDelayMs <= 0) {
            throw new Error("Retry delay must be greater than 0");
        }
    }

    protected initializeMetrics(): StageMetrics {
        return {
            startTime: new Date(),
            retryAttempts: 0,
            status: "pending"
        };
    }

    protected updateMetrics(updates: Partial<StageMetrics> = {}): void {
        this.metrics = {
            ...this.metrics,
            ...updates
        };
        this.notifyListeners();
    }

    protected notifyListeners(): void {
        const metrics = this.getMetrics();
        this.metricListeners.forEach((listener) => listener(metrics));
    }

    protected startExecution(startTime: Date): void {
        this.metrics = {
            ...this.initializeMetrics(),
            startTime
        };
        this.notifyListeners();
    }

    protected completeExecution(startTime: Date, endTime: Date): void {
        this.updateMetrics({
            endTime,
            duration: endTime.getTime() - startTime.getTime(),
            status: "success"
        });
    }

    protected failExecution(error: Error, startTime: Date, endTime: Date): void {
        this.updateMetrics({
            endTime,
            duration: endTime.getTime() - startTime.getTime(),
            status: "error",
            error: {
                code: error instanceof PipelineError ? error.code : "STAGE_ERROR",
                message: error.message,
                details: error instanceof PipelineError ? { executionId: error.executionId } : undefined
            }
        });
    }

    protected calculateRetryDelay(attempt: number): number {
        const baseDelay = this.config.retryDelayMs ?? 1000;

        if (this.config.useExponentialBackoff) {
            return Math.min(baseDelay * Math.pow(2, attempt - 1), 30000);
        }

        return baseDelay;
    }

    protected async delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    protected wrapError(error: any): Error {
        if (error instanceof PipelineError) {
            return error;
        }

        return new PipelineError(
            "STAGE_ERROR",
            `Stage ${this.id} execution failed: ${error.message}`,
            (error as any).executionId ?? "unknown"
        );
    }
}
