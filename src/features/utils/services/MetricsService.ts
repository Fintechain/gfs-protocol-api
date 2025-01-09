// src/features/utils/services/MetricsService.ts

import { Service } from "@tsed/di";
import { BeforeInit } from "@tsed/platform-http";
import { Counter, Gauge, Histogram, Registry } from "prom-client";

import { LoggerService } from "./LoggerService.js";

@Service()
export class MetricsService implements BeforeInit {
    private registry: Registry;
    private counters: Map<string, Counter> = new Map();
    private gauges: Map<string, Gauge> = new Map();
    private histograms: Map<string, Histogram> = new Map();

    constructor(private logger: LoggerService) {
        try {
            this.registry = new Registry();
        } catch (error) {
            this.logger.error("Failed to create metrics registry", { error });
            throw error;
        }
    }

    /**
     * Initialize metrics service
     */
    async $beforeInit(): Promise<void> {
        try {
            // Initialize default metrics
            this.createCounter("http_requests_total", "Total HTTP requests");
            this.createGauge("http_requests_active", "Active HTTP requests");
            this.createHistogram("http_request_duration_seconds", "HTTP request duration");

            this.logger.info("Metrics service initialized");
        } catch (error) {
            this.logger.error("Failed to initialize metrics", { error });
            throw error;
        }
    }

    /**
     * Create a counter metric
     * @param name Metric name
     * @param help Help text
     * @param labelNames Label names
     * @throws Error if counter already exists
     */
    createCounter(name: string, help: string, labelNames: string[] = []): Counter {
        if (this.counters.has(name)) {
            throw new Error(`Counter "${name}" already exists`);
        }

        const counter = new Counter({ name, help, labelNames });
        this.registry.registerMetric(counter);
        this.counters.set(name, counter);
        return counter;
    }

    /**
     * Increment a counter
     * @param name Counter name
     * @param labels Label values
     * @param value Increment value
     * @throws Error if counter not found or value invalid
     */
    incrementCounter(name: string, labels: Record<string, string> = {}, value = 1): void {
        const counter = this.counters.get(name);
        if (!counter) {
            throw new Error(`Counter "${name}" not found`);
        }

        if (value <= 0) {
            throw new Error("Increment value must be positive");
        }

        counter.inc(labels, value);
    }

    /**
     * Create a gauge metric
     * @param name Metric name
     * @param help Help text
     * @param labelNames Label names
     * @throws Error if gauge already exists
     */
    createGauge(name: string, help: string, labelNames: string[] = []): Gauge {
        if (this.gauges.has(name)) {
            throw new Error(`Gauge "${name}" already exists`);
        }

        const gauge = new Gauge({ name, help, labelNames });
        this.registry.registerMetric(gauge);
        this.gauges.set(name, gauge);
        return gauge;
    }

    /**
     * Set a gauge value
     * @param name Gauge name
     * @param value Gauge value
     * @param labels Label values
     * @throws Error if gauge not found
     */
    setGauge(name: string, value: number, labels: Record<string, string> = {}): void {
        const gauge = this.gauges.get(name);
        if (!gauge) {
            throw new Error(`Gauge "${name}" not found`);
        }
        gauge.set(labels, value);
    }

    /**
     * Create a histogram metric
     * @param name Metric name
     * @param help Help text
     * @param labelNames Label names
     * @throws Error if histogram already exists
     */
    createHistogram(name: string, help: string, labelNames: string[] = []): Histogram {
        if (this.histograms.has(name)) {
            throw new Error(`Histogram "${name}" already exists`);
        }

        const histogram = new Histogram({ name, help, labelNames });
        this.registry.registerMetric(histogram);
        this.histograms.set(name, histogram);
        return histogram;
    }

    /**
     * Observe a histogram value
     * @param name Histogram name
     * @param value Observed value
     * @param labels Label values
     * @throws Error if histogram not found or value invalid
     */
    observeHistogram(name: string, value: number, labels: Record<string, string> = {}): void {
        const histogram = this.histograms.get(name);
        if (!histogram) {
            throw new Error(`Histogram "${name}" not found`);
        }

        if (value < 0) {
            throw new Error("Observation value must be non-negative");
        }

        histogram.observe(labels, value);
    }

    /**
     * Get metrics in Prometheus format
     * @returns Prometheus formatted metrics
     * @throws Error if metrics retrieval fails
     */
    async getMetrics(): Promise<string> {
        try {
            return await this.registry.metrics();
        } catch (error) {
            this.logger.error("Failed to get metrics", { error });
            throw error;
        }
    }
}
