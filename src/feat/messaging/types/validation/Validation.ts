import { RawMessage } from "../message/index.js";
import { Pipeline, PipelineContext, PipelineStage } from "../pipeline/Pipeline.js";
import { ValidationRule } from "./Rules.js";

/**
 * Represents the result of a validation operation.
 */
export interface ValidationResult {
    /** Indicates whether the validation passed or failed. */
    valid: boolean;
    /** An array of validation errors, if any. */
    errors: ValidationError[];
}

/**
 * Represents an error that occurs during the validation of an ISO 20022 message.
 */
export interface ValidationError {
    /** The error code identifying the type of validation error. */
    code: string;
    /** A human-readable description of the validation error. */
    message: string;
    /** The path or location of the error within the message, if applicable. */
    path?: string;
    /** Severity level of the error */
    severity: "error" | "warning";
    /** Additional error context or data */
    details?: Record<string, unknown>;
    /** Suggested fix for the error */
    suggestedFix?: string;
}

/**
 * Represents the context for the validation pipeline.
 */
export interface ValidationPipelineContext extends PipelineContext<RawMessage> {
    // Add validation-specific properties or methods
}

/**
 * Represents a stage in the validation pipeline.
 * Each validation stage performs a specific validation task on the ISO 20022 message.
 */
export interface ValidationStage extends PipelineStage {
    /**
     * Validates the ISO 20022 message.
     * @param context The validation pipeline context.
     * @returns A promise that resolves to the validation result.
     */
    validate(context: ValidationPipelineContext): Promise<ValidationResult>;

    /**
     * Adds a validation rule to the stage.
     * @param rule The validation rule to add.
     */
    addRule(rule: ValidationRule): void;

    /**
     * Retrieves all validation rules for the stage.
     * @returns Array of validation rules.
     */
    getRules(): ValidationRule[];
}

/**
 * Represents a validation pipeline for executing validation stages.
 */
export interface ValidationPipeline extends Pipeline<ValidationStage, ValidationPipelineContext> {
    /**
     * Executes the validation pipeline by running each validation stage in sequence.
     * @param context The validation pipeline context.
     * @returns A promise that resolves to the validation result.
     */
    execute(context: ValidationPipelineContext): Promise<ValidationResult>;
}

/**
 * Represents a factory for creating validation pipelines based on the message type.
 */
export interface ValidationPipelineFactory {
    /**
     * Creates a validation pipeline for the given message type.
     * @param messageType The type of the ISO 20022 message.
     * @returns The validation pipeline instance.
     */
    createValidationPipeline(messageType: string): ValidationPipeline;
}
