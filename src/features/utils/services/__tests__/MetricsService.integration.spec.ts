// src/features/utils/services/__tests__/MetricsService.integration.spec.ts

import { PlatformTest } from "@tsed/platform-http/testing";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { LoggerService } from "../LoggerService.js";
import { MetricsService } from "../MetricsService.js";

describe("MetricsService Integration", () => {
    let service: MetricsService;
    let logger: LoggerService;

    beforeAll(async () => {
        // Initialize platform and services
        await PlatformTest.create();
        logger = PlatformTest.get<LoggerService>(LoggerService);
        service = new MetricsService(logger);
        await service.$beforeInit();
    });

    afterAll(async () => {
        await PlatformTest.reset();
    });

    describe("Metric Collection and Format", () => {
        it("should collect and format default metrics correctly", async () => {
            const metrics = await service.getMetrics();

            // Verify metrics format
            expect(metrics).toContain("# HELP http_requests_total Total HTTP requests");
            expect(metrics).toContain("# TYPE http_requests_total counter");
            expect(metrics).toContain("# HELP http_requests_active Active HTTP requests");
            expect(metrics).toContain("# TYPE http_requests_active gauge");
            expect(metrics).toContain("# HELP http_request_duration_seconds HTTP request duration");
            expect(metrics).toContain("# TYPE http_request_duration_seconds histogram");
        });

        it("should track request metrics accurately", async () => {
            const requestCounter = "api_requests_total";
            const activeGauge = "api_requests_active";
            const durationHist = "api_request_duration";

            // Create metrics
            service.createCounter(requestCounter, "API request counter", ["method", "path"]);
            service.createGauge(activeGauge, "Active API requests");
            service.createHistogram(durationHist, "API request duration", ["method"]);

            // Simulate requests
            service.incrementCounter(requestCounter, { method: "GET", path: "/api/test" });
            service.incrementCounter(requestCounter, { method: "POST", path: "/api/test" });
            service.setGauge(activeGauge, 2);
            service.observeHistogram(durationHist, 0.123, { method: "GET" });

            const metrics = await service.getMetrics();

            // Verify counter
            expect(metrics).toContain(`${requestCounter}{method="GET",path="/api/test"} 1`);
            expect(metrics).toContain(`${requestCounter}{method="POST",path="/api/test"} 1`);

            // Verify gauge
            expect(metrics).toContain(`${activeGauge} 2`);

            // Verify histogram
            // Check histogram metadata
            expect(metrics).toContain(`# HELP ${durationHist} API request duration`);
            expect(metrics).toContain(`# TYPE ${durationHist} histogram`);

            // Check histogram data
            expect(metrics).toContain(`${durationHist}_sum{method="GET"} 0.123`);
            expect(metrics).toContain(`${durationHist}_count{method="GET"} 1`);
        });
    });

    describe("Real-time Metric Updates", () => {
        it("should handle concurrent metric updates", async () => {
            const counterName = "concurrent_ops";
            const counter = service.createCounter(counterName, "Concurrent operations");

            // Perform concurrent increments
            await Promise.all(Array.from({ length: 100 }, () => Promise.resolve(service.incrementCounter(counterName))));

            const metrics = await service.getMetrics();
            expect(metrics).toContain(`${counterName} 100`);
        });

        it("should track timing accurately", async () => {
            const histogramName = "operation_duration";
            service.createHistogram(histogramName, "Operation duration");

            // Simulate timed operation
            const start = process.hrtime();
            await new Promise((resolve) => setTimeout(resolve, 100));
            const [seconds, nanoseconds] = process.hrtime(start);
            const duration = seconds + nanoseconds / 1e9;

            service.observeHistogram(histogramName, duration);

            const metrics = await service.getMetrics();
            expect(metrics).toContain(`${histogramName}_sum`);
            expect(metrics).toContain(`${histogramName}_count 1`);
        });
    });

    describe("Label Handling", () => {
        it("should handle complex label combinations", async () => {
            const metricName = "complex_metric";
            service.createCounter(metricName, "Complex metric", ["service", "method", "status", "error_type"]);

            // Add metrics with different label combinations
            service.incrementCounter(metricName, {
                service: "auth",
                method: "login",
                status: "success",
                error_type: ""
            });

            service.incrementCounter(metricName, {
                service: "auth",
                method: "login",
                status: "error",
                error_type: "validation"
            });

            const metrics = await service.getMetrics();
            expect(metrics).toContain(`${metricName}{service="auth",method="login",status="success",error_type=""} 1`);
            expect(metrics).toContain(`${metricName}{service="auth",method="login",status="error",error_type="validation"} 1`);
        });
    });

    describe("Performance", () => {
        it("should handle high-volume metric updates efficiently", async () => {
            const metricName = "high_volume";
            const iterations = 10000;

            service.createCounter(metricName, "High volume metric");

            const startTime = Date.now();

            // Perform many rapid increments
            for (let i = 0; i < iterations; i++) {
                service.incrementCounter(metricName);
            }

            await service.getMetrics(); // Ensure all updates are processed

            const duration = Date.now() - startTime;
            expect(duration).toBeLessThan(1000); // Should process 10k updates in under 1 second
        });
    });

    describe("Error Cases", () => {
        it("should handle metric name collisions", async () => {
            const metricName = "collision_test";

            // Create counter
            service.createCounter(metricName, "Test metric");

            // Attempt to create different metric types with same name
            expect(() => service.createGauge(metricName, "Test metric")).toThrow(
                `A metric with the name ${metricName} has already been registered.`
            );

            expect(() => service.createHistogram(metricName, "Test metric")).toThrow(
                `A metric with the name ${metricName} has already been registered.`
            );
        });

        it("should validate metric names", async () => {
            const invalidNames = [
                "invalid-name", // contains hyphen
                "1invalid", // starts with number
                "" // empty
            ];

            for (const name of invalidNames) {
                expect(() => service.createCounter(name, "Test")).toThrow();
            }
        });
    });

    describe("Metric Persistence", () => {
        it("should maintain metric values across retrievals", async () => {
            const metricName = "persistent_counter";
            service.createCounter(metricName, "Persistent metric");

            // Increment and verify multiple times
            for (let i = 1; i <= 3; i++) {
                service.incrementCounter(metricName);
                const metrics = await service.getMetrics();
                expect(metrics).toContain(`${metricName} ${i}`);
            }
        });
    });
});
