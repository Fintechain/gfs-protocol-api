// src/features/messages/services/MessageValidationService.ts

import { Inject, Service } from "@tsed/di";

import { User } from "../../auth/models/User.js";
import { CacheService } from "../../utils/services/CacheService.js";
import { ConfigService } from "../../utils/services/ConfigService.js";
import { LoggerService } from "../../utils/services/LoggerService.js";
import { Message } from "../models/Message.js";
import { MessageValidation, ValidationResult } from "../models/MessageValidation.js";
import { ValidationError } from "../types/Errors.js";
import { RuleResult, ValidationResultItem, ValidationResults } from "../types/Messages.js";

@Service()
export class MessageValidationService {
    private readonly SCHEMA_CACHE_TTL = 3600; // 1 hour

    constructor(
        private logger: LoggerService,
        private config: ConfigService,
        private cache: CacheService,
        @Inject("DATABASE_CONNECTION") private repository: any,
        @Inject("CURRENT_USER") private currentUser: User
    ) {
        this.logger = logger.child({ service: "MessageValidationService" });
    }

    /**
     * Create a new validation record
     */
    private createValidation(message: Message, type: string): MessageValidation {
        const validation = new MessageValidation();
        validation.message = message;
        validation.message_id = message.id;
        validation.validation_type = type;
        validation.version = message.version;
        validation.performed_by = this.currentUser.id;
        validation.performed_by_user = this.currentUser;
        validation.result = ValidationResult.FAILED; // Default to FAILED
        validation.details = {}; // Initialize empty details
        return validation;
    }

    /**
     * Convert MessageValidation to ValidationRecord
     */
    private toValidationRecord(validation: MessageValidation): ValidationResultItem {
        return {
            type: validation.validation_type,
            isValid: validation.result === ValidationResult.PASSED,
            validationErrors: validation.details.errors?.map((error) => ({
                field: error.path || error.code,
                message: error.message
            })),
            details: validation.details.context
        };
    }

    /**
     * Validate message comprehensively
     */
    async validateMessage(message: Message): Promise<ValidationResults> {
        try {
            const validations: ValidationResultItem[] = [];

            // 1. Schema validation
            const schemaValidation = await this.validateSchema(message);
            validations.push(this.toValidationRecord(schemaValidation));

            // 2. Business rules validation
            const businessValidation = await this.validateBusinessRules(message);
            validations.push(this.toValidationRecord(businessValidation));

            // 3. Protocol-specific validation
            const protocolValidation = await this.validateProtocolRequirements(message);
            validations.push(this.toValidationRecord(protocolValidation));

            // 4. Settlement validation if applicable
            if (message.requiresSettlement()) {
                const settlementValidation = await this.validateSettlementRequirements(message);
                validations.push(this.toValidationRecord(settlementValidation));
            }

            // Save all validation results
            await Promise.all(
                [
                    schemaValidation,
                    businessValidation,
                    protocolValidation,
                    ...(message.requiresSettlement() ? [await this.validateSettlementRequirements(message)] : [])
                ].map((validation) => this.repository.save(MessageValidation, validation))
            );

            return {
                isValid: validations.every((v) => v.isValid),
                validations,
                timestamp: new Date()
            };
        } catch (error) {
            this.logger.error("Message validation failed", { error, messageId: message.id });
            throw new ValidationError("Message validation failed", [
                {
                    field: "message",
                    message: error instanceof Error ? error.message : "Unknown error occurred"
                }
            ]);
        }
    }

    /**
     * Validate message against ISO20022 schema
     */
    private async validateSchema(message: Message): Promise<MessageValidation> {
        try {
            const schema = await this.loadSchema(message.message_type);
            const validation = this.createValidation(message, "schema");
            validation.schema_version = schema.version;

            try {
                await schema.validate(message.xml_payload);
                validation.result = ValidationResult.PASSED;
            } catch (error) {
                validation.result = ValidationResult.FAILED;
                validation.details = {
                    errors: [
                        {
                            code: "SCHEMA_VALIDATION_ERROR",
                            message: error instanceof Error ? error.message : "Schema validation error"
                        }
                    ]
                };
            }

            return validation;
        } catch (error) {
            throw new ValidationError("Schema validation failed", [
                {
                    field: "schema",
                    message: error instanceof Error ? error.message : "Schema loading error"
                }
            ]);
        }
    }

    /**
     * Validate message against business rules
     */
    private async validateBusinessRules(message: Message): Promise<MessageValidation> {
        const rules = await this.loadBusinessRules(message.message_type);
        const validation = this.createValidation(message, "business_rules");

        const results = await Promise.all(rules.map((rule) => this.evaluateBusinessRule(message, rule)));

        const errors = results
            .filter((r) => !r.valid)
            .map((r) => ({
                code: r.code,
                message: r.message
            }));

        validation.result = errors.length === 0 ? ValidationResult.PASSED : ValidationResult.FAILED;
        validation.details = { errors };

        return validation;
    }

    /**
     * Validate protocol-specific requirements
     */
    private async validateProtocolRequirements(message: Message): Promise<MessageValidation> {
        const validation = this.createValidation(message, "protocol");

        const requirements = await this.loadProtocolRequirements(message.protocol_submission_type);
        const results = await Promise.all(requirements.map((req) => this.evaluateProtocolRequirement(message, req)));

        const errors = results
            .filter((r) => !r.valid)
            .map((r) => ({
                code: r.code,
                message: r.message
            }));

        validation.result = errors.length === 0 ? ValidationResult.PASSED : ValidationResult.FAILED;
        validation.details = { errors };

        return validation;
    }

    /**
     * Validate settlement requirements
     */
    private async validateSettlementRequirements(message: Message): Promise<MessageValidation> {
        const validation = this.createValidation(message, "settlement");

        try {
            const parsedPayload = message.parsed_payload;
            const errors: Array<{ code: string; message: string }> = [];

            if (!this.isValidAmount(parsedPayload.amount)) {
                errors.push({
                    code: "INVALID_AMOUNT",
                    message: "Settlement amount is invalid"
                });
            }

            if (!(await this.isCurrencySupported(parsedPayload.currency))) {
                errors.push({
                    code: "UNSUPPORTED_CURRENCY",
                    message: "Currency not supported for settlement"
                });
            }

            validation.result = errors.length === 0 ? ValidationResult.PASSED : ValidationResult.FAILED;
            validation.details = { errors };

            return validation;
        } catch (error) {
            throw new ValidationError("Settlement validation failed", [
                {
                    field: "settlement",
                    message: error instanceof Error ? error.message : "Settlement validation error"
                }
            ]);
        }
    }

    // Helper methods
    private async loadSchema(messageType: string): Promise<any> {
        const cacheKey = `schema:${messageType}`;
        let schema = await this.cache.get(cacheKey);

        if (!schema) {
            // Implementation to load ISO20022 schema
            schema = {}; // TODO: Implement actual schema loading
            await this.cache.set(cacheKey, schema, { ttl: this.SCHEMA_CACHE_TTL });
        }

        return schema;
    }

    private async loadBusinessRules(messageType: string): Promise<any[]> {
        // Implementation to load business rules
        return [];
    }

    private async loadProtocolRequirements(submissionType: string): Promise<any[]> {
        // Implementation to load protocol requirements
        return [];
    }

    private async evaluateBusinessRule(message: Message, rule: any): Promise<RuleResult> {
        // Implementation to evaluate business rule
        return { valid: true, code: "", message: "" };
    }

    private async evaluateProtocolRequirement(message: Message, requirement: any): Promise<RuleResult> {
        // Implementation to evaluate protocol requirement
        return { valid: true, code: "", message: "" };
    }

    private isValidAmount(amount: string): boolean {
        if (!amount) return false;
        return /^\d+(\.\d{1,2})?$/.test(amount);
    }

    private async isCurrencySupported(currency: string): Promise<boolean> {
        if (!currency) return false;
        const supportedCurrencies = await this.config.get("supportedCurrencies", ["USD", "EUR"]);
        return supportedCurrencies.includes(currency.toUpperCase());
    }
}
