// src/features/utils/services/__tests__/LoggerService.spec.ts

import { PlatformTest } from "@tsed/platform-http/testing";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { LoggerService } from "../LoggerService.js";

// Create mock logger instance
const mockLoggerInstance = {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    trace: vi.fn(),
    child: vi.fn()
};

// Mock pino module
vi.mock("pino", () => ({
    default: vi.fn(() => mockLoggerInstance),
    // Mock transport and other pino exports
    transport: vi.fn(),
    destination: vi.fn(),
    stdTimeFunctions: {
        isoTime: () => "2024-01-01T00:00:00.000Z"
    }
}));

describe("LoggerService", () => {
    let service: LoggerService;

    beforeEach(async () => {
        // Clear all mocks before each test
        vi.clearAllMocks();

        // Setup child logger mock
        mockLoggerInstance.child.mockReturnValue(mockLoggerInstance);

        // Create fresh platform test instance
        await PlatformTest.create();

        // Create service instance
        service = PlatformTest.get<LoggerService>(LoggerService);
    });

    afterEach(async () => {
        await PlatformTest.reset();
    });

    describe("Log Level Methods", () => {
        describe("error", () => {
            it("should log error with context and error object", () => {
                const message = "Error occurred";
                const context = { userId: "123" };
                const error = new Error("Test error");

                service.error(message, context, error);

                expect(mockLoggerInstance.error).toHaveBeenCalledWith(
                    expect.objectContaining({
                        ...context,
                        requestId: expect.any(String),
                        err: error
                    }),
                    message
                );
            });

            it("should log error with only message", () => {
                const message = "Simple error";

                service.error(message);

                expect(mockLoggerInstance.error).toHaveBeenCalledWith(
                    expect.objectContaining({
                        requestId: expect.any(String)
                    }),
                    message
                );
            });
        });

        describe("info", () => {
            it("should log info with context", () => {
                const message = "Info message";
                const context = { action: "test" };

                service.info(message, context);

                expect(mockLoggerInstance.info).toHaveBeenCalledWith(
                    expect.objectContaining({
                        ...context,
                        requestId: expect.any(String)
                    }),
                    message
                );
            });
        });

        describe("debug", () => {
            it("should log debug with context", () => {
                const message = "Debug message";
                const context = { debugInfo: "test" };

                service.debug(message, context);

                expect(mockLoggerInstance.debug).toHaveBeenCalledWith(
                    expect.objectContaining({
                        ...context,
                        requestId: expect.any(String)
                    }),
                    message
                );
            });
        });

        describe("warn", () => {
            it("should log warning with context", () => {
                const message = "Warning message";
                const context = { warning: "test" };

                service.warn(message, context);

                expect(mockLoggerInstance.warn).toHaveBeenCalledWith(
                    expect.objectContaining({
                        ...context,
                        requestId: expect.any(String)
                    }),
                    message
                );
            });
        });
    });

    describe("Child Logger", () => {
        it("should create child logger with bindings", () => {
            const bindings = { service: "TestService" };

            const childLogger = service.child(bindings);

            expect(mockLoggerInstance.child).toHaveBeenCalledWith(bindings);
            expect(childLogger).toBeInstanceOf(LoggerService);
        });

        it("should maintain context in child logger", () => {
            const bindings = { service: "TestService" };
            const message = "Test message";

            const childLogger = service.child(bindings);
            childLogger.info(message);

            expect(mockLoggerInstance.info).toHaveBeenCalledWith(
                expect.objectContaining({
                    service: "TestService",
                    requestId: expect.any(String)
                }),
                message
            );
        });
    });

    describe("Request ID Generation", () => {
        it("should use provided request ID from context", () => {
            const requestId = "test-request-id";
            const message = "Test message";
            const context = { requestId };

            service.info(message, context);

            expect(mockLoggerInstance.info).toHaveBeenCalledWith(
                expect.objectContaining({
                    requestId
                }),
                message
            );
        });

        it("should generate request ID if not provided", () => {
            const message = "Test message";

            service.info(message);

            expect(mockLoggerInstance.info).toHaveBeenCalledWith(
                expect.objectContaining({
                    requestId: expect.any(String)
                }),
                message
            );
        });
    });
});
