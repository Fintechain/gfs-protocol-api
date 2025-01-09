// src/errors/AppError.ts

/**
 * Base application error
 * All custom errors should extend this base error
 */
export class AppError extends Error {
    constructor(
        message: string,
        readonly statusCode: number = 500,
        options?: ErrorOptions
    ) {
        super(message, options);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Resource not found error
 */
export class NotFoundError extends AppError {
    constructor(message: string, options?: ErrorOptions) {
        super(message, 404, options);
    }
}

/**
 * Validation error
 */
export class ValidationError extends AppError {
    constructor(
        message: string,
        readonly errors?: Array<{ field?: string; message: string }>,
        options?: ErrorOptions
    ) {
        super(message, 400, options);
        this.errors = errors;
    }
}

/**
 * Authorization error
 */
export class AuthorizationError extends AppError {
    constructor(message: string, options?: ErrorOptions) {
        super(message, 403, options);
    }
}

/**
 * Bad request error
 */
export class BadRequestError extends AppError {
    constructor(message: string, options?: ErrorOptions) {
        super(message, 400, options);
    }
}

/**
 * Service unavailable error
 */
export class ServiceError extends AppError {
    constructor(message: string, options?: ErrorOptions) {
        super(message, 503, options);
    }
}
