// src/features/utils/services/LoggerService.ts

import { Service } from "@tsed/di";
import pino, { Logger as PinoLogger } from "pino";
import { ulid } from "ulid";

export enum LogLevel {
    ERROR = "error",
    WARN = "warn",
    INFO = "info",
    DEBUG = "debug",
    TRACE = "trace"
}

interface LogContext {
    requestId?: string;
    userId?: string;
    [key: string]: any;
}

@Service()
export class LoggerService {
    private logger: PinoLogger;
    private bindings: Record<string, any> = {};

    constructor() {
        this.logger = pino({
            level: process.env.LOG_LEVEL || "info",
            timestamp: () => `,"time":"${new Date().toISOString()}"`,
            formatters: {
                level: (label: any) => ({ level: label })
            },
            ...(process.env.NODE_ENV !== "test" && {
                transport: {
                    target: "pino/file",
                    options: { destination: "combined.log" }
                }
            })
        });
    }

    error(message: string, context?: LogContext, error?: Error): void {
        this.log(LogLevel.ERROR, message, context, error);
    }

    warn(message: string, context?: LogContext): void {
        this.log(LogLevel.WARN, message, context);
    }

    info(message: string, context?: LogContext): void {
        this.log(LogLevel.INFO, message, context);
    }

    debug(message: string, context?: LogContext): void {
        this.log(LogLevel.DEBUG, message, context);
    }

    trace(message: string, context?: LogContext): void {
        this.log(LogLevel.TRACE, message, context);
    }

    child(bindings: Record<string, any>): LoggerService {
        const childLogger = new LoggerService();
        childLogger.logger = this.logger.child(bindings);
        childLogger.bindings = { ...this.bindings, ...bindings };
        return childLogger;
    }

    private log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
        const logContext = {
            requestId: context?.requestId || ulid(),
            ...this.bindings, // Include bindings in log context
            ...context
        };

        if (error) {
            this.logger[level]({ ...logContext, err: error }, message);
        } else {
            this.logger[level](logContext, message);
        }
    }
}
