/**
 * File: /src/features/messaging/services/__tests__/BasePipeline.spec.ts
 * Tests for the BasePipeline implementation
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

import { PipelineConfig } from "../../../config/types/index.js";
import { PipelineContext, PipelineStage } from "../../types/index.js";
import { BasePipeline, PipelineError } from "../BasePipeline.js";

// Test implementations
interface TestContext extends PipelineContext<string> {
    data: string;
}

class TestStage implements PipelineStage {
    constructor(
        public readonly id: string,
        public readonly name: string,
        public readonly description: string,
        public readonly order: number,
        public readonly dependencies?: string[]
    ) {}
}

class TestPipeline extends BasePipeline<TestStage, TestContext> {
    protected async executeStage(stage: TestStage, context: TestContext): Promise<boolean> {
        // Mock stage execution with slight delay to ensure non-zero duration
        await new Promise((resolve) => setTimeout(resolve, 10));
        return true;
    }
}

describe("BasePipeline", () => {
    let pipeline: TestPipeline;
    let config: PipelineConfig;

    beforeEach(() => {
        config = {
            maxConcurrent: 1,
            cacheResults: false,
            failFast: false,
            maxRetries: 3,
            retryDelayMs: 1000,
            timeoutMs: 5000
        };
        pipeline = new TestPipeline(config);
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe("Stage Management", () => {
        it("should add a stage successfully", () => {
            const stage = new TestStage("test", "Test Stage", "Test Description", 1);
            expect(() => pipeline.addStage(stage)).not.toThrow();
        });

        it("should throw error when adding duplicate stage", () => {
            const stage = new TestStage("test", "Test Stage", "Test Description", 1);
            pipeline.addStage(stage);
            expect(() => pipeline.addStage(stage)).toThrow(PipelineError);
        });

        it("should remove a stage successfully", () => {
            const stage = new TestStage("test", "Test Stage", "Test Description", 1);
            pipeline.addStage(stage);
            expect(() => pipeline.removeStage(stage)).not.toThrow();
        });

        it("should throw error when removing non-existent stage", () => {
            const stage = new TestStage("test", "Test Stage", "Test Description", 1);
            expect(() => pipeline.removeStage(stage)).toThrow(PipelineError);
        });

        it("should throw error when removing stage with dependents", () => {
            const stage1 = new TestStage("stage1", "Stage 1", "Description", 1);
            const stage2 = new TestStage("stage2", "Stage 2", "Description", 2, ["stage1"]);

            pipeline.addStage(stage1);
            pipeline.addStage(stage2);

            expect(() => pipeline.removeStage(stage1)).toThrow(PipelineError);
        });
    });

    describe("Dependency Management", () => {
        it("should detect circular dependencies", () => {
            // First add both stages
            const stage1 = new TestStage("stage1", "Stage 1", "Description", 1);
            const stage2 = new TestStage("stage2", "Stage 2", "Description", 2);

            pipeline.addStage(stage1);
            pipeline.addStage(stage2);

            // Now try to create a circular dependency
            const stage1WithCircular = new TestStage("stage1", "Stage 1", "Description", 1, ["stage2"]);
            const stage2WithCircular = new TestStage("stage2", "Stage 2", "Description", 2, ["stage1"]);

            // Attempting to update to create circular dependency should fail
            expect(() => {
                pipeline.removeStage(stage1);
                pipeline.addStage(stage1WithCircular);
                pipeline.removeStage(stage2);
                pipeline.addStage(stage2WithCircular);
            }).toThrow(PipelineError);
        });

        it("should validate dependencies exist", () => {
            const stage = new TestStage("test", "Test Stage", "Description", 1, ["non-existent"]);
            expect(() => pipeline.addStage(stage)).toThrow(PipelineError);
        });

        it("should execute stages in dependency order", async () => {
            const executedStages: string[] = [];

            class OrderedTestPipeline extends TestPipeline {
                protected async executeStage(stage: TestStage, context: TestContext): Promise<boolean> {
                    executedStages.push(stage.id);
                    return true;
                }
            }

            const orderedPipeline = new OrderedTestPipeline(config);

            // Add stages in the correct order
            const stage1 = new TestStage("stage1", "Stage 1", "Description", 1);
            const stage2 = new TestStage("stage2", "Stage 2", "Description", 2, ["stage1"]);
            const stage3 = new TestStage("stage3", "Stage 3", "Description", 3, ["stage2"]);

            orderedPipeline.addStage(stage1);
            orderedPipeline.addStage(stage2);
            orderedPipeline.addStage(stage3);

            const context: TestContext = {
                data: "test",
                executionId: "test",
                metrics: { startTime: new Date(), stageMetrics: new Map() }
            };

            await orderedPipeline.execute(context);
            expect(executedStages).toEqual(["stage1", "stage2", "stage3"]);
        });
    });

    describe("Execution", () => {
        it("should execute all stages successfully", async () => {
            const stage1 = new TestStage("stage1", "Stage 1", "Description", 1);
            const stage2 = new TestStage("stage2", "Stage 2", "Description", 2);

            pipeline.addStage(stage1);
            pipeline.addStage(stage2);

            const context: TestContext = {
                data: "test",
                executionId: "test",
                metrics: { startTime: new Date(), stageMetrics: new Map() }
            };

            // Run the execution and advance timers
            const promise = pipeline.execute(context);
            // Advance enough time for both stages (20ms each plus buffer)
            await vi.advanceTimersByTimeAsync(50);
            const result = await promise;

            expect(result).toBe("test");

            // Verify both stages were executed
            const metrics = pipeline.getMetrics();
            expect(metrics.stageMetrics.get("stage1")?.status).toBe("success");
            expect(metrics.stageMetrics.get("stage2")?.status).toBe("success");
        });

        it("should handle stage execution failures", async () => {
            class FailingPipeline extends TestPipeline {
                protected async executeStage(stage: TestStage, context: TestContext): Promise<boolean> {
                    if (stage.id === "stage2") {
                        return false;
                    }
                    return true;
                }
            }

            const failingPipeline = new FailingPipeline({ ...config, failFast: true });
            const stage1 = new TestStage("stage1", "Stage 1", "Description", 1);
            const stage2 = new TestStage("stage2", "Stage 2", "Description", 2);

            failingPipeline.addStage(stage1);
            failingPipeline.addStage(stage2);

            const context: TestContext = {
                data: "test",
                executionId: "test",
                metrics: { startTime: new Date(), stageMetrics: new Map() }
            };

            await expect(failingPipeline.execute(context)).rejects.toThrow(PipelineError);
        });

        it("should handle timeouts", async () => {
            class TimeoutPipeline extends TestPipeline {
                protected async executeStage(stage: TestStage, context: TestContext): Promise<boolean> {
                    await new Promise((resolve) => {
                        const longDelay = setTimeout(resolve, 1000);
                        vi.advanceTimersByTime(150); // Advance past timeout
                        clearTimeout(longDelay);
                    });
                    return true;
                }
            }

            const timeoutPipeline = new TimeoutPipeline({ ...config, timeoutMs: 100 });
            const stage = new TestStage("test", "Test Stage", "Description", 1);
            timeoutPipeline.addStage(stage);

            const context: TestContext = {
                data: "test",
                executionId: "test",
                metrics: { startTime: new Date(), stageMetrics: new Map() }
            };

            await expect(timeoutPipeline.execute(context)).rejects.toThrow(PipelineError);

            const metrics = timeoutPipeline.getMetrics();
            expect(metrics.stageMetrics.get("test")?.status).toBe("error");
        });
    });

    describe("Metrics Collection", () => {
        it("should collect execution metrics", async () => {
            const stage = new TestStage("test", "Test Stage", "Description", 1);
            pipeline.addStage(stage);

            const context: TestContext = {
                data: "test",
                executionId: "test",
                metrics: { startTime: new Date(), stageMetrics: new Map() }
            };

            const promise = pipeline.execute(context);
            await vi.advanceTimersByTimeAsync(100);
            await promise;

            const metrics = pipeline.getMetrics();

            expect(metrics.startTime).toBeDefined();
            expect(metrics.endTime).toBeDefined();
            expect(metrics.duration).toBeGreaterThan(0);
            expect(metrics.stageMetrics.get("test")?.status).toBe("success");
        });

        it("should notify metric subscribers", async () => {
            const listener = vi.fn();
            const unsubscribe = pipeline.subscribe(listener);

            const stage = new TestStage("test", "Test Stage", "Description", 1);
            pipeline.addStage(stage);

            const context: TestContext = {
                data: "test",
                executionId: "test",
                metrics: { startTime: new Date(), stageMetrics: new Map() }
            };

            const promise = pipeline.execute(context);
            await vi.advanceTimersByTimeAsync(100);
            await promise;

            expect(listener).toHaveBeenCalled();

            unsubscribe();
            listener.mockClear();

            const promise2 = pipeline.execute(context);
            await vi.advanceTimersByTimeAsync(100);
            await promise2;

            expect(listener).not.toHaveBeenCalled();
        });
    });

    describe("Error Handling", () => {
        it("should handle stage execution errors", async () => {
            class ErrorPipeline extends TestPipeline {
                protected async executeStage(stage: TestStage, context: TestContext): Promise<boolean> {
                    throw new Error("Stage execution failed");
                }
            }

            const errorPipeline = new ErrorPipeline(config);
            const stage = new TestStage("test", "Test Stage", "Description", 1);

            errorPipeline.addStage(stage);

            const context: TestContext = {
                data: "test",
                executionId: "test",
                metrics: { startTime: new Date(), stageMetrics: new Map() }
            };

            await expect(errorPipeline.execute(context)).rejects.toThrow();
            const metrics = errorPipeline.getMetrics();
            expect(metrics.stageMetrics.get("test")?.status).toBe("error");
        });

        it("should handle dependency validation errors", () => {
            const stage1 = new TestStage("stage1", "Stage 1", "Description", 1, ["stage2"]);
            const stage2 = new TestStage("stage2", "Stage 2", "Description", 2, ["stage1"]);

            expect(() => {
                pipeline.addStage(stage1);
                pipeline.addStage(stage2);
            }).toThrow(PipelineError);
        });
    });
});
