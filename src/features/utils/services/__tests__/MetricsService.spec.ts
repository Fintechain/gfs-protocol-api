// src/features/utils/services/__tests__/MetricsService.spec.ts

import { PlatformTest } from "@tsed/platform-http/testing";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { LoggerService } from "../LoggerService.js";
import { MetricsService } from "../MetricsService.js";

// Mock prom-client module before imports
vi.mock("prom-client", () => ({
    Counter: vi.fn(() => ({
        inc: vi.fn(),
        name: "mock_counter"
    })),
    Gauge: vi.fn(() => ({
        set: vi.fn(),
        name: "mock_gauge"
    })),
    Histogram: vi.fn(() => ({
        observe: vi.fn(),
        name: "mock_histogram"
    })),
    Registry: vi.fn(() => ({
        registerMetric: vi.fn(),
        metrics: vi.fn().mockResolvedValue("metrics data")
    }))
}));

// Import prom-client after mock
const promClient = await import("prom-client");

describe("MetricsService", () => {
    let service: MetricsService;
    let logger: LoggerService;

    beforeEach(async () => {
        // Reset all mocks
        vi.clearAllMocks();

        // Create mock logger
        logger = {
            info: vi.fn(),
            error: vi.fn(),
            debug: vi.fn(),
            warn: vi.fn()
        } as any;

        // Create test platform
        await PlatformTest.create();

        // Create service instance
        service = new MetricsService(logger);
    });

    afterEach(async () => {
        await PlatformTest.reset();
    });

    describe("Initialization", () => {
        describe("$beforeInit", () => {
            it("should initialize default metrics", async () => {
                await service.$beforeInit();

                // Verify default metrics creation
                expect(promClient.Counter).toHaveBeenCalledWith({
                    name: "http_requests_total",
                    help: "Total HTTP requests",
                    labelNames: []
                });

                expect(promClient.Gauge).toHaveBeenCalledWith({
                    name: "http_requests_active",
                    help: "Active HTTP requests",
                    labelNames: []
                });

                expect(promClient.Histogram).toHaveBeenCalledWith({
                    name: "http_request_duration_seconds",
                    help: "HTTP request duration",
                    labelNames: []
                });

                expect(logger.info).toHaveBeenCalledWith("Metrics service initialized");
            });

            it("should handle initialization errors", async () => {
                const error = new Error("Registry error");
                // Mock Counter to throw error
                (promClient.Counter as ReturnType<typeof vi.fn>).mockImplementationOnce(() => {
                    throw error;
                });

                const testService = new MetricsService(logger);
                await expect(testService.$beforeInit()).rejects.toThrow(error);
                expect(logger.error).toHaveBeenCalledWith("Failed to initialize metrics", expect.objectContaining({ error }));
            });
        });
    });

    describe("Counter Operations", () => {
        describe("createCounter", () => {
            it("should create and register counter", () => {
                const name = "test_counter";
                const help = "Test counter";
                const labelNames = ["label1", "label2"];

                const counter = service.createCounter(name, help, labelNames);

                expect(promClient.Counter).toHaveBeenCalledWith({
                    name,
                    help,
                    labelNames
                });
                expect(counter).toBeDefined();
            });

            it("should prevent duplicate counter creation", () => {
                const name = "test_counter";
                service.createCounter(name, "help");
                expect(() => service.createCounter(name, "help")).toThrow(`Counter "${name}" already exists`);
            });
        });

        describe("incrementCounter", () => {
            it("should increment existing counter", () => {
                const name = "test_counter";
                const labels = { label1: "value1" };
                const value = 2;

                const counter = service.createCounter(name, "help");
                service.incrementCounter(name, labels, value);

                expect(counter.inc).toHaveBeenCalledWith(labels, value);
            });

            it("should handle invalid increment values", () => {
                const name = "test_counter";
                service.createCounter(name, "help");
                expect(() => service.incrementCounter(name, {}, -1)).toThrow("Increment value must be positive");
            });

            it("should throw error for non-existent counter", () => {
                expect(() => service.incrementCounter("non_existent")).toThrow('Counter "non_existent" not found');
            });
        });
    });

    describe("Gauge Operations", () => {
        describe("createGauge", () => {
            it("should create and register gauge", () => {
                const name = "test_gauge";
                const help = "Test gauge";
                const labelNames = ["label1"];

                const gauge = service.createGauge(name, help, labelNames);

                expect(promClient.Gauge).toHaveBeenCalledWith({
                    name,
                    help,
                    labelNames
                });
                expect(gauge).toBeDefined();
            });

            it("should prevent duplicate gauge creation", () => {
                const name = "test_gauge";
                service.createGauge(name, "help");
                expect(() => service.createGauge(name, "help")).toThrow(`Gauge "${name}" already exists`);
            });
        });

        describe("setGauge", () => {
            it("should set gauge value", () => {
                const name = "test_gauge";
                const value = 42;
                const labels = { label1: "value1" };

                const gauge = service.createGauge(name, "help");
                service.setGauge(name, value, labels);

                expect(gauge.set).toHaveBeenCalledWith(labels, value);
            });

            it("should throw error for non-existent gauge", () => {
                expect(() => service.setGauge("non_existent", 42)).toThrow('Gauge "non_existent" not found');
            });
        });
    });

    describe("Histogram Operations", () => {
        describe("createHistogram", () => {
            it("should create and register histogram", () => {
                const name = "test_histogram";
                const help = "Test histogram";
                const labelNames = ["label1"];

                const histogram = service.createHistogram(name, help, labelNames);

                expect(promClient.Histogram).toHaveBeenCalledWith({
                    name,
                    help,
                    labelNames
                });
                expect(histogram).toBeDefined();
            });

            it("should prevent duplicate histogram creation", () => {
                const name = "test_histogram";
                service.createHistogram(name, "help");
                expect(() => service.createHistogram(name, "help")).toThrow(`Histogram "${name}" already exists`);
            });
        });

        describe("observeHistogram", () => {
            it("should observe histogram value", () => {
                const name = "test_histogram";
                const value = 0.123;
                const labels = { label1: "value1" };

                const histogram = service.createHistogram(name, "help");
                service.observeHistogram(name, value, labels);

                expect(histogram.observe).toHaveBeenCalledWith(labels, value);
            });

            it("should handle invalid observation values", () => {
                const name = "test_histogram";
                service.createHistogram(name, "help");
                expect(() => service.observeHistogram(name, -1)).toThrow("Observation value must be non-negative");
            });

            it("should throw error for non-existent histogram", () => {
                expect(() => service.observeHistogram("non_existent", 0.5)).toThrow('Histogram "non_existent" not found');
            });
        });
    });

    describe("Metrics Retrieval", () => {
        it("should return metrics in Prometheus format", async () => {
            const metricsData = await service.getMetrics();
            expect(metricsData).toBe("metrics data");
        });

        it("should handle metrics retrieval errors", async () => {
            const error = new Error("Metrics error");
            const registry = (service as any).registry;
            registry.metrics.mockRejectedValueOnce(error);

            await expect(service.getMetrics()).rejects.toThrow(error);
        });
    });
});
