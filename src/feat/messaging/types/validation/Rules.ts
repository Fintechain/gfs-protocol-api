/**
 * File: /src/features/core/types/validation/rules.types.ts
 * Contains validation rule type definitions for ISO 20022 message validation
 */

/**
 * Represents the base validation rule configuration
 */
export interface BaseValidationRule {
    /** Unique identifier for the rule */
    id: string;
    /** Field path in the message to validate */
    field: string;
    /** Type of validation to perform */
    type: ValidationRuleType;
    /** Error message to display if validation fails */
    errorMessage: string;
    /** Severity level of validation failure */
    severity: "error" | "warning";
    /** Whether to stop validation if this rule fails */
    stopOnFailure?: boolean;
    /** Custom validation function for complex rules */
    validateFn?: (value: unknown) => boolean | Promise<boolean>;
}

/**
 * Enumeration of validation rule types
 */
export type ValidationRuleType = "required" | "format" | "length" | "range" | "pattern" | "codelist" | "crossfield" | "custom";

/**
 * Required field validation rule
 */
export interface RequiredValidationRule extends BaseValidationRule {
    type: "required";
    /** Whether to allow empty strings */
    allowEmpty?: boolean;
}

/**
 * Format validation rule for fields like BIC, IBAN, etc.
 */
export interface FormatValidationRule extends BaseValidationRule {
    type: "format";
    /** Format specification */
    format: "BIC" | "IBAN" | "LEI" | "ISO8601" | "ISO4217";
}

/**
 * Length validation rule for string fields
 */
export interface LengthValidationRule extends BaseValidationRule {
    type: "length";
    /** Minimum length allowed */
    min?: number;
    /** Maximum length allowed */
    max?: number;
    /** Exact length required */
    exact?: number;
}

/**
 * Range validation rule for numeric fields
 */
export interface RangeValidationRule extends BaseValidationRule {
    type: "range";
    /** Minimum value allowed */
    min?: number;
    /** Maximum value allowed */
    max?: number;
    /** Whether the range is inclusive */
    inclusive?: boolean;
}

/**
 * Pattern validation rule for string fields
 */
export interface PatternValidationRule extends BaseValidationRule {
    type: "pattern";
    /** Regular expression pattern */
    pattern: string;
    /** Pattern description for error messages */
    patternDescription?: string;
}

/**
 * Code list validation rule for enumerated values
 */
export interface CodeListValidationRule extends BaseValidationRule {
    type: "codelist";
    /** List of allowed values */
    allowedValues: string[];
    /** Whether case-sensitive comparison should be used */
    caseSensitive?: boolean;
}

/**
 * Cross-field validation rule for related fields
 */
export interface CrossFieldValidationRule extends BaseValidationRule {
    type: "crossfield";
    /** Related field paths */
    relatedFields: string[];
    /** Validation function */
    validate: (values: Record<string, unknown>) => boolean;
    /** Description of the relationship for error messages */
    relationshipDescription: string;
}

/**
 * Custom validation rule for complex validations
 */
export interface CustomValidationRule extends BaseValidationRule {
    type: "custom";
    /** Custom validation function */
    validateFn: (value: unknown, context?: unknown) => boolean | Promise<boolean>;
    /** Description of the validation for error messages */
    validationDescription: string;
}

/**
 * Union type of all validation rules
 */
export type ValidationRule =
    | RequiredValidationRule
    | FormatValidationRule
    | LengthValidationRule
    | RangeValidationRule
    | PatternValidationRule
    | CodeListValidationRule
    | CrossFieldValidationRule
    | CustomValidationRule;

/**
 * Represents a group of validation rules
 */
export interface ValidationRuleGroup {
    /** Group identifier */
    groupId: string;
    /** Group name */
    name: string;
    /** Group description */
    description: string;
    /** List of validation rules in the group */
    rules: ValidationRule[];
    /** Whether all rules in the group must pass */
    requireAll: boolean;
}

/**
 * Represents a validation rule configuration for a message type
 */
export interface MessageValidationRules {
    /** Message type identifier */
    messageType: string;
    /** Validation rule groups */
    ruleGroups: ValidationRuleGroup[];
    /** Global validation options */
    options: {
        /** Whether to stop on first error */
        stopOnFirstError: boolean;
        /** Whether to execute groups sequentially */
        sequentialExecution: boolean;
    };
}

/**
 * Factory for creating validation rules
 */
export interface ValidationRuleFactory {
    /**
     * Creates a required field validation rule
     */
    createRequiredRule(field: string, errorMessage: string, options?: Partial<RequiredValidationRule>): RequiredValidationRule;

    /**
     * Creates a format validation rule
     */
    createFormatRule(
        field: string,
        format: FormatValidationRule["format"],
        errorMessage: string,
        options?: Partial<FormatValidationRule>
    ): FormatValidationRule;

    /**
     * Creates a length validation rule
     */
    createLengthRule(field: string, errorMessage: string, options: Partial<LengthValidationRule>): LengthValidationRule;

    /**
     * Creates a range validation rule
     */
    createRangeRule(field: string, errorMessage: string, options: Partial<RangeValidationRule>): RangeValidationRule;

    /**
     * Creates a pattern validation rule
     */
    createPatternRule(
        field: string,
        pattern: string,
        errorMessage: string,
        options?: Partial<PatternValidationRule>
    ): PatternValidationRule;

    /**
     * Creates a code list validation rule
     */
    createCodeListRule(
        field: string,
        allowedValues: string[],
        errorMessage: string,
        options?: Partial<CodeListValidationRule>
    ): CodeListValidationRule;

    /**
     * Creates a cross-field validation rule
     */
    createCrossFieldRule(
        fields: string[],
        validate: CrossFieldValidationRule["validate"],
        errorMessage: string,
        options?: Partial<CrossFieldValidationRule>
    ): CrossFieldValidationRule;

    /**
     * Creates a custom validation rule
     */
    createCustomRule(
        field: string,
        validateFn: CustomValidationRule["validateFn"],
        errorMessage: string,
        options?: Partial<CustomValidationRule>
    ): CustomValidationRule;
}
