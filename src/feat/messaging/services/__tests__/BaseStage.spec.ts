/**
 * File: /src/features/messaging/stages/__tests__/BaseStage.spec.ts
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PipelineContext } from "../../types/pipeline/Pipeline.js";
import { PipelineError } from "../BasePipeline.js";
import { BaseStage, StageConfig } from "../BaseStage.js";

interface TestContext extends PipelineContext<string> {
    data: string;
}

class TestStage extends BaseStage<TestContext> {
    public executionDelay = 0;
    public shouldFail = false;

    protected async executeStage(context: TestContext): Promise<boolean> {
        await new Promise<void>((resolve) => {
            setTimeout(resolve, 10);
            if (process.env.NODE_ENV === "test") {
                vi.advanceTimersByTime(10);
            }
        });

        if (this.executionDelay > 0) {
            await new Promise<void>((resolve) => {
                setTimeout(resolve, this.executionDelay);
                if (process.env.NODE_ENV === "test") {
                    vi.advanceTimersByTime(this.executionDelay);
                }
            });
        }

        if (this.shouldFail) {
            throw new Error("Stage execution failed");
        }

        return true;
    }
}

describe("BaseStage", () => {
    let config: StageConfig;
    let stage: TestStage;
    let context: TestContext;

    beforeEach(() => {
        config = {
            timeoutMs: 1000,
            maxRetries: 2,
            retryDelayMs: 100,
            useExponentialBackoff: true
        };
        stage = new TestStage("test-stage", "Test Stage", "A test stage implementation", 1, config);
        context = {
            data: "test-data",
            executionId: "test-execution",
            metrics: {
                startTime: new Date(),
                stageMetrics: new Map()
            }
        };
        vi.useFakeTimers({ shouldAdvanceTime: true });
    });

    afterEach(() => {
        vi.clearAllTimers();
        vi.clearAllMocks();
        vi.useRealTimers();
    });

    describe("Configuration", () => {
        it("should initialize with valid configuration", () => {
            expect(stage.id).toBe("test-stage");
            expect(stage.name).toBe("Test Stage");
            expect(stage.description).toBe("A test stage implementation");
            expect(stage.order).toBe(1);
        });

        it("should validate configuration values", () => {
            expect(() => new TestStage("test", "Test", "Description", 1, { timeoutMs: -1 })).toThrow("Timeout must be greater than 0");

            expect(() => new TestStage("test", "Test", "Description", 1, { maxRetries: -1 })).toThrow("Max retries must be non-negative");

            expect(() => new TestStage("test", "Test", "Description", 1, { retryDelayMs: -1 })).toThrow(
                "Retry delay must be greater than 0"
            );
        });
    });

    describe("Dependency Management", () => {
        it("should manage dependencies correctly", () => {
            expect(stage.dependencies).toEqual([]);

            stage.addDependency("dep1");
            expect(stage.dependencies).toContain("dep1");

            stage.addDependency("dep2");
            expect(stage.dependencies).toContain("dep2");

            stage.removeDependency("dep1");
            expect(stage.dependencies).not.toContain("dep1");
            expect(stage.dependencies).toContain("dep2");
        });

        it("should prevent self-dependencies", () => {
            expect(() => stage.addDependency("test-stage")).toThrow("Stage cannot depend on itself");
        });

        it("should not add duplicate dependencies", () => {
            stage.addDependency("dep1");
            stage.addDependency("dep1");
            expect(stage.dependencies.filter((d) => d === "dep1").length).toBe(1);
        });
    });

    describe("Execution", () => {
        it("should execute successfully", async () => {
            try {
                await vi.advanceTimersByTime(50);
                const result = await stage.execute(context);

                expect(result).toBe(true);
                const metrics = stage.getMetrics();
                expect(metrics.status).toBe("success");
                expect(metrics.duration).toBeGreaterThan(0);
            } catch (error) {
                expect.fail("Should not have thrown an error");
            }
        });

        it("should handle timeouts", async () => {
            stage.executionDelay = 2000; // Longer than timeout

            try {
                const executePromise = stage.execute(context);
                vi.advanceTimersByTime(1100);
                await executePromise;
                expect.fail("Should have thrown timeout error");
            } catch (error) {
                expect(error).toBeInstanceOf(PipelineError);
                expect((error as Error).message).toMatch(/timed out/);

                const metrics = stage.getMetrics();
                expect(metrics.status).toBe("error");
                expect(metrics.error?.code).toBe("STAGE_ERROR");
            }
        });

        it("should retry on failures", async () => {
            stage.shouldFail = true;

            try {
                const executePromise = stage.execute(context);

                // Advance through initial attempt and retries
                for (let i = 0; i <= config.maxRetries; i++) {
                    vi.advanceTimersByTime(150);
                }

                await executePromise;
                expect.fail("Should have thrown error");
            } catch (error) {
                expect(error).toBeInstanceOf(PipelineError);
                expect((error as Error).message).toContain("Stage execution failed");

                const metrics = stage.getMetrics();
                expect(metrics.retryAttempts).toBe(config.maxRetries);
                expect(metrics.status).toBe("error");
            }
        });

        it("should use exponential backoff for retries", async () => {
            stage.shouldFail = true;
            const delays: number[] = [];

            const delaySpy = vi.spyOn(stage as any, "delay");
            delaySpy.mockImplementation(async (ms: number) => {
                delays.push(ms);
                vi.advanceTimersByTime(ms);
            });

            try {
                const executePromise = stage.execute(context);
                vi.advanceTimersByTime(500);
                await executePromise;
                expect.fail("Should have thrown error");
            } catch (error) {
                expect(delays).toHaveLength(2);
                expect(delays[0]).toBe(config.retryDelayMs);
                expect(delays[1]).toBe(config.retryDelayMs * 2);
            } finally {
                delaySpy.mockRestore();
            }
        });
    });

    describe("Metrics Collection", () => {
        it("should collect execution metrics", async () => {
            try {
                vi.advanceTimersByTime(50);
                await stage.execute(context);

                const metrics = stage.getMetrics();
                expect(metrics.startTime).toBeDefined();
                expect(metrics.endTime).toBeDefined();
                expect(metrics.duration).toBeGreaterThan(0);
                expect(metrics.status).toBe("success");
                expect(metrics.retryAttempts).toBe(0);
            } catch (error) {
                expect.fail("Should not have thrown an error");
            }
        });

        it("should notify metric subscribers", async () => {
            const listener = vi.fn();
            const unsubscribe = stage.subscribe(listener);

            try {
                vi.advanceTimersByTime(50);
                await stage.execute(context);
                expect(listener).toHaveBeenCalled();

                unsubscribe();
                listener.mockClear();

                vi.advanceTimersByTime(50);
                await stage.execute(context);
                expect(listener).not.toHaveBeenCalled();
            } catch (error) {
                expect.fail("Should not have thrown an error");
            }
        });

        it("should track error metrics", async () => {
            stage.shouldFail = true;

            try {
                vi.advanceTimersByTime(50);
                await stage.execute(context);
                expect.fail("Should have thrown an error");
            } catch (error) {
                const metrics = stage.getMetrics();
                expect(metrics.status).toBe("error");
                expect(metrics.error).toBeDefined();
                expect(metrics.error?.code).toBe("STAGE_ERROR");
                expect(metrics.error?.message).toContain("Stage execution failed");
            }
        });
    });

    describe("Error Handling", () => {
        it("should wrap errors in PipelineError", async () => {
            stage.shouldFail = true;

            try {
                vi.advanceTimersByTime(50);
                await stage.execute(context);
                expect.fail("Should have thrown an error");
            } catch (error) {
                expect(error).toBeInstanceOf(PipelineError);
                expect((error as PipelineError).code).toBe("STAGE_ERROR");
                expect((error as Error).message).toContain("Stage execution failed");
            }
        });

        it("should preserve PipelineError properties", async () => {
            stage.shouldFail = true;

            try {
                vi.advanceTimersByTime(50);
                await stage.execute(context);
                expect.fail("Should have thrown an error");
            } catch (error) {
                const pipelineError = error as PipelineError;
                expect(pipelineError.code).toBe("STAGE_ERROR");
                expect(pipelineError.executionId).toBe("unknown");
            }
        });
    });
});
