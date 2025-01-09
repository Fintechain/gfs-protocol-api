// src/features/messages/controllers/ValidationController.ts

import { Controller } from "@tsed/di";
import { BodyParams } from "@tsed/platform-params";
import { Description, Post, Returns, Summary } from "@tsed/schema";

import { LoggerService } from "../../utils/services/LoggerService.js";
import { ISO20022MessageService } from "../services/ISO20022MessageService.js";
import { MessageValidationService } from "../services/MessageValidationService.js";
import { ValidateMessageDTO, ValidationResultDTO } from "../types/MessageDTO.js";

/**
 * Controller handling message validation operations.
 *
 * Provides endpoints for validating ISO20022 messages against schemas,
 * business rules, and protocol requirements before submission.
 */
@Controller("/messages/validate")
export class ValidationController {
    constructor(
        private iso20022Service: ISO20022MessageService,
        private validationService: MessageValidationService,
        private logger: LoggerService
    ) {
        this.logger = logger.child({ controller: "ValidationController" });
    }

    /**
     * Validate an ISO20022 message
     *
     * Performs comprehensive validation including:
     * - ISO20022 schema validation
     * - Business rules validation
     * - Protocol-specific requirements
     * - Settlement requirements (if applicable)
     *
     * @param payload Validation payload containing ISO20022 XML
     * @returns Validation results with any errors or warnings
     */
    @Post("/")
    @Summary("Validate ISO20022 message")
    @Description("Performs comprehensive message validation")
    @Returns(200, ValidationResultDTO)
    async validateMessage(@BodyParams() payload: ValidateMessageDTO): Promise<ValidationResultDTO> {
        try {
            this.logger.debug("Starting message validation", {
                xmlLength: payload.xml.length,
                messageType: payload.messageType
            });

            // Step 1: Parse and perform initial ISO20022 validation
            const parsedMessage = await this.iso20022Service.parseMessage(payload.xml);

            this.logger.debug("Message parsed successfully", {
                messageType: parsedMessage.messageType,
                submissionType: parsedMessage.submissionType
            });

            // Step 2: Create temporary message object for validation
            const tempMessage = this.createTemporaryMessage(parsedMessage);

            // Step 3: Perform comprehensive validation
            const validationResults = await this.validationService.validateMessage(tempMessage);

            this.logger.info("Validation completed", {
                isValid: validationResults.isValid,
                validationCount: validationResults.validations.length
            });

            // Transform validation results to API response format
            return this.transformValidationResults(validationResults);
        } catch (error) {
            this.logger.error("Validation failed", { error });
            throw error;
        }
    }

    /**
     * Create a temporary message object for validation
     */
    private createTemporaryMessage(parsedMessage: any) {
        return {
            message_type: parsedMessage.messageType,
            protocol_submission_type: parsedMessage.submissionType,
            xml_payload: parsedMessage.originalXml,
            parsed_payload: parsedMessage.parsedData,
            requiresSettlement: () => parsedMessage.requiresSettlement
        };
    }

    /**
     * Transform internal validation results to API response format
     */
    private transformValidationResults(results: any): ValidationResultDTO {
        const response = new ValidationResultDTO(results.isValid);
        response.errors = results.validations
            .filter((v: any) => v.result === "failed")
            .map((v: any) => ({
                code: v.details.errors?.[0]?.code || "VALIDATION_ERROR",
                message: v.details.errors?.[0]?.message || "Validation failed",
                severity: "ERROR",
                field: v.type
            }));
        response.warnings = results.validations
            .filter((v: any) => v.result === "warning")
            .map((v: any) => ({
                code: v.details.warnings?.[0]?.code || "VALIDATION_WARNING",
                message: v.details.warnings?.[0]?.message || "Validation warning",
                severity: "WARNING",
                field: v.type
            }));

        return response;
    }
}
