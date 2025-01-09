// src/features/messages/controllers/__tests__/ValidationController.spec.ts

import { beforeEach, describe, expect, it, Mock, vi } from "vitest";

import { LoggerService } from "../../../utils/services/LoggerService.js";
import { ProtocolSubmissionType } from "../../models/Message.js";
import { ValidationError } from "../../types/Errors.js";
import { ValidateMessageDTO, ValidationResultDTO } from "../../types/MessageDTO.js";
import { ValidationController } from "../ValidationController.js";

describe("ValidationController", () => {
    let controller: ValidationController;
    let iso20022Service: { parseMessage: Mock };
    let validationService: { validateMessage: Mock };
    let logger: LoggerService;

    const mockParsedMessage = {
        messageType: "pacs.008",
        submissionType: ProtocolSubmissionType.PACS_008,
        originalXml: "<xml>test</xml>",
        parsedData: { test: "data" },
        details: {
            messageId: "test-id",
            creationDate: new Date(),
            amount: "100",
            currency: "USD",
            debtorAgent: "TESTBANK",
            creditorAgent: "TESTBANK"
        }
    };

    const mockValidationResults = {
        isValid: true,
        validations: [
            {
                type: "schema",
                result: "passed",
                details: {}
            },
            {
                type: "business_rules",
                result: "warning",
                details: {
                    warnings: [
                        {
                            code: "WARN001",
                            message: "Optional field missing"
                        }
                    ]
                }
            }
        ],
        timestamp: new Date()
    };

    beforeEach(() => {
        // Create mock services
        iso20022Service = {
            parseMessage: vi.fn()
        };

        validationService = {
            validateMessage: vi.fn()
        };

        logger = {
            error: vi.fn(),
            warn: vi.fn(),
            info: vi.fn(),
            debug: vi.fn(),
            child: vi.fn().mockReturnThis()
        } as unknown as LoggerService;

        // Create controller instance
        controller = new ValidationController(iso20022Service as any, validationService as any, logger);

        // Reset all mocks
        vi.clearAllMocks();
    });

    describe("validateMessage", () => {
        const mockPayload = new ValidateMessageDTO("<xml>test</xml>");

        it("should validate message successfully", async () => {
            iso20022Service.parseMessage.mockResolvedValue(mockParsedMessage);
            validationService.validateMessage.mockResolvedValue(mockValidationResults);

            const result = await controller.validateMessage(mockPayload);

            expect(result).toBeInstanceOf(ValidationResultDTO);
            expect(result.isValid).toBe(true);
            expect(result.warnings).toHaveLength(1);
            expect(result.errors).toHaveLength(0);

            expect(iso20022Service.parseMessage).toHaveBeenCalledWith(mockPayload.xml);
            expect(logger.info).toHaveBeenCalledWith("Validation completed", expect.any(Object));
        });

        it("should handle validation failure", async () => {
            iso20022Service.parseMessage.mockResolvedValue(mockParsedMessage);
            validationService.validateMessage.mockResolvedValue({
                ...mockValidationResults,
                isValid: false,
                validations: [
                    {
                        type: "schema",
                        result: "failed",
                        details: {
                            errors: [
                                {
                                    code: "ERR001",
                                    message: "Invalid schema"
                                }
                            ]
                        }
                    }
                ]
            });

            const result = await controller.validateMessage(mockPayload);

            expect(result.isValid).toBe(false);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0]).toEqual({
                code: "ERR001",
                message: "Invalid schema",
                severity: "ERROR",
                field: "schema"
            });
        });

        it("should handle message parsing errors", async () => {
            const parseError = new ValidationError("Invalid XML", [{ field: "xml", message: "Malformed XML" }]);
            iso20022Service.parseMessage.mockRejectedValue(parseError);

            await expect(controller.validateMessage(mockPayload)).rejects.toThrow(ValidationError);
            expect(logger.error).toHaveBeenCalledWith(
                "Validation failed",
                expect.objectContaining({
                    error: parseError
                })
            );
        });

        it("should handle messages with warnings", async () => {
            iso20022Service.parseMessage.mockResolvedValue(mockParsedMessage);
            validationService.validateMessage.mockResolvedValue({
                isValid: true,
                validations: [
                    {
                        type: "business_rules",
                        result: "warning",
                        details: {
                            warnings: [
                                {
                                    code: "WARN001",
                                    message: "Recommended field missing"
                                }
                            ]
                        }
                    }
                ],
                timestamp: new Date()
            });

            const result = await controller.validateMessage(mockPayload);

            expect(result.isValid).toBe(true);
            expect(result.warnings).toHaveLength(1);
            expect(result.warnings[0]).toEqual({
                code: "WARN001",
                message: "Recommended field missing",
                severity: "WARNING",
                field: "business_rules"
            });
        });

        it("should handle service errors", async () => {
            iso20022Service.parseMessage.mockResolvedValue(mockParsedMessage);
            validationService.validateMessage.mockRejectedValue(new Error("Service error"));

            await expect(controller.validateMessage(mockPayload)).rejects.toThrow("Service error");
            expect(logger.error).toHaveBeenCalled();
        });

        it("should respect validation options", async () => {
            const payloadWithOptions = new ValidateMessageDTO("<xml>test</xml>", undefined, {
                skipSchemaValidation: true
            });

            iso20022Service.parseMessage.mockResolvedValue(mockParsedMessage);
            validationService.validateMessage.mockResolvedValue(mockValidationResults);

            await controller.validateMessage(payloadWithOptions);

            expect(logger.debug).toHaveBeenCalledWith(
                "Starting message validation",
                expect.objectContaining({
                    xmlLength: payloadWithOptions.xml.length
                })
            );
        });
    });
});
