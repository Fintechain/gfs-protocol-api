// src/features/messages/services/__tests__/MessageValidationService.spec.ts

import { PlatformTest } from "@tsed/platform-http/testing";
import { beforeEach, describe, expect, it, Mock, vi } from "vitest";

import { User } from "../../../auth/models/User.js";
import { CacheService } from "../../../utils/services/CacheService.js";
import { ConfigService } from "../../../utils/services/ConfigService.js";
import { LoggerService } from "../../../utils/services/LoggerService.js";
import { Message, MessageStatus, ProtocolSubmissionType } from "../../models/Message.js";
import { MessageValidation, ValidationResult } from "../../models/MessageValidation.js";
import { ValidationError } from "../../types/Errors.js";
import { MessageValidationService } from "../MessageValidationService.js";

// Define mock types that include Vitest mock methods
type MockedAsyncFunction<T extends (...args: any) => Promise<any>> = Mock;

describe("MessageValidationService", () => {
    let service: MessageValidationService;
    let logger: LoggerService;
    let config: ConfigService;
    let cache: CacheService;
    let repository: any;
    let currentUser: User;

    // Create mock message
    const createMockMessage = (overrides = {}) => {
        const message = new Message();
        message.id = "test-id";
        message.message_type = "pacs.008";
        message.protocol_submission_type = ProtocolSubmissionType.PACS_008;
        message.xml_payload = "<xml>test</xml>";
        message.parsed_payload = {
            amount: "100.00",
            currency: "USD"
        };
        message.version = 1;
        message.status = MessageStatus.VALIDATING;
        // Default to not requiring settlement
        message.requiresSettlement = () => false;
        return Object.assign(message, overrides);
    };

    beforeEach(async () => {
        // Create mock current user
        currentUser = new User();
        currentUser.id = "user-123";
        currentUser.first_name = "Test";
        currentUser.last_name = "User";
        currentUser.email = "test.user@example.com";
        currentUser.password_hash = "hashed_password";
        currentUser.is_active = true;
        currentUser.email_verified = true;
        currentUser.primary_institution_id = "inst-123";
        currentUser.created_at = new Date();
        currentUser.updated_at = new Date();

        // Create mock logger
        logger = {
            error: vi.fn(),
            warn: vi.fn(),
            info: vi.fn(),
            debug: vi.fn(),
            child: vi.fn().mockReturnThis()
        } as unknown as LoggerService;

        // Create mock config
        config = {
            get: vi.fn()
        } as unknown as ConfigService;

        // Create mock cache service
        cache = {
            get: vi.fn(),
            set: vi.fn()
        } as unknown as CacheService;

        // Create mock repository with save returning the input
        repository = {
            save: vi.fn().mockImplementation((entity, validation) => Promise.resolve(validation)),
            findOne: vi.fn()
        };

        // Create service instance
        service = new MessageValidationService(logger, config, cache, repository, currentUser);

        // Reset all mocks
        vi.clearAllMocks();
    });

    describe("validateMessage", () => {
        it("should validate message successfully", async () => {
            const mockMessage = createMockMessage();

            // Mock successful schema validation
            (cache.get as MockedAsyncFunction<typeof cache.get>).mockResolvedValueOnce({
                version: "1.0",
                validate: async () => true
            });

            // Mock supported currencies
            (config.get as MockedAsyncFunction<typeof config.get>).mockResolvedValueOnce(["USD", "EUR"]);

            const result = await service.validateMessage(mockMessage);

            expect(result.isValid).toBe(true);
            expect(result.validations).toHaveLength(3); // Schema, business rules, and protocol validations
            expect(result.timestamp).toBeInstanceOf(Date);

            // Verify validation records were saved
            expect(repository.save).toHaveBeenCalledTimes(3);
        });

        it("should handle schema validation failures", async () => {
            const mockMessage = createMockMessage();
            const validationError = new Error("Invalid schema");

            // Mock failed schema validation
            (cache.get as MockedAsyncFunction<typeof cache.get>).mockResolvedValueOnce({
                version: "1.0",
                validate: async () => {
                    throw validationError;
                }
            });

            const result = await service.validateMessage(mockMessage);

            expect(result.isValid).toBe(false);
            expect(result.validations[0].type).toBe("schema");
            expect(result.validations[0].isValid).toBe(false);
            expect(result.validations[0].validationErrors).toContainEqual({
                field: "SCHEMA_VALIDATION_ERROR",
                message: validationError.message
            });
        });

        it("should handle settlement validation for applicable messages", async () => {
            const mockMessage = createMockMessage({
                requiresSettlement: () => true
            });

            // Mock successful schema validation
            (cache.get as MockedAsyncFunction<typeof cache.get>).mockResolvedValueOnce({
                version: "1.0",
                validate: async () => true
            });

            // Mock empty business rules and protocol requirements
            (config.get as MockedAsyncFunction<typeof config.get>).mockImplementation((key: string) => {
                if (key === "supportedCurrencies") return ["USD", "EUR"];
                if (key === "businessRules") return [];
                if (key === "protocolRequirements") return [];
                return null;
            });

            // Mock successful repository saves
            repository.save.mockImplementation((entity: any, validation: any) => Promise.resolve(validation));

            const result = await service.validateMessage(mockMessage);

            expect(result.isValid).toBe(true);
            expect(result.validations).toHaveLength(4); // Including settlement validation
            const settlementValidation = result.validations.find((v) => v.type === "settlement");
            expect(settlementValidation?.type).toBe("settlement");
            expect(settlementValidation?.isValid).toBe(true);
        });

        it("should fail settlement validation for invalid amount", async () => {
            const mockMessage = createMockMessage({
                requiresSettlement: () => true,
                parsed_payload: {
                    amount: "invalid",
                    currency: "USD"
                }
            });

            // Mock successful schema validation
            (cache.get as MockedAsyncFunction<typeof cache.get>).mockResolvedValueOnce({
                version: "1.0",
                validate: async () => true
            });

            // Mock config values including supported currencies
            (config.get as MockedAsyncFunction<typeof config.get>).mockImplementation((key: string) => {
                if (key === "supportedCurrencies") return ["USD", "EUR"];
                if (key === "businessRules") return [];
                if (key === "protocolRequirements") return [];
                return null;
            });

            // Mock successful repository saves
            repository.save.mockImplementation((entity: any, validation: any) => Promise.resolve(validation));

            const result = await service.validateMessage(mockMessage);

            expect(result.isValid).toBe(false);
            const settlementValidation = result.validations.find((v) => v.type === "settlement");
            expect(settlementValidation).toBeDefined();
            expect(settlementValidation?.isValid).toBe(false);
            expect(settlementValidation?.validationErrors).toContainEqual({
                field: "INVALID_AMOUNT",
                message: "Settlement amount is invalid"
            });
        });
    });

    describe("Schema Cache", () => {
        it("should use cached schema if available", async () => {
            const mockMessage = createMockMessage();
            const cachedSchema = {
                version: "1.0",
                validate: async () => true
            };

            (cache.get as MockedAsyncFunction<typeof cache.get>).mockResolvedValueOnce(cachedSchema);

            await service.validateMessage(mockMessage);

            expect(cache.get).toHaveBeenCalledWith(`schema:${mockMessage.message_type}`);
            expect(cache.set).not.toHaveBeenCalled();
        });

        it("should cache schema if not found", async () => {
            const mockMessage = createMockMessage();

            (cache.get as MockedAsyncFunction<typeof cache.get>).mockResolvedValueOnce(null);

            await service.validateMessage(mockMessage);

            expect(cache.set).toHaveBeenCalledWith(`schema:${mockMessage.message_type}`, expect.any(Object), { ttl: 3600 });
        });
    });

    describe("Validation Records", () => {
        it("should create validation records with correct metadata", async () => {
            const mockMessage = createMockMessage();

            (cache.get as MockedAsyncFunction<typeof cache.get>).mockResolvedValueOnce({
                version: "1.0",
                validate: async () => true
            });

            const result = await service.validateMessage(mockMessage);

            // Verify validation record creation
            const savedValidation = repository.save.mock.calls[0][1];
            expect(savedValidation).toMatchObject({
                message_id: mockMessage.id,
                version: mockMessage.version,
                performed_by: currentUser.id,
                performed_by_user: currentUser
            });
        });

        it("should set correct validation result based on validation outcome", async () => {
            const mockMessage = createMockMessage();
            const validationError = new Error("Validation failed");

            (cache.get as MockedAsyncFunction<typeof cache.get>).mockResolvedValueOnce({
                version: "1.0",
                validate: async () => {
                    throw validationError;
                }
            });

            const result = await service.validateMessage(mockMessage);

            const savedValidation = repository.save.mock.calls[0][1];
            expect(savedValidation).toMatchObject({
                result: ValidationResult.FAILED,
                details: {
                    errors: [
                        {
                            code: "SCHEMA_VALIDATION_ERROR",
                            message: validationError.message
                        }
                    ]
                }
            });
        });
    });

    describe("Error Handling", () => {
        it("should handle schema loading errors", async () => {
            const mockMessage = createMockMessage();
            const schemaError = new Error("Failed to load schema");
            (cache.get as MockedAsyncFunction<typeof cache.get>).mockRejectedValueOnce(schemaError);

            await expect(service.validateMessage(mockMessage)).rejects.toThrow(ValidationError);

            expect(logger.error).toHaveBeenCalledWith(
                "Message validation failed",
                expect.objectContaining({
                    error: expect.any(Error),
                    messageId: mockMessage.id
                })
            );
        });

        it("should handle database errors during validation save", async () => {
            const mockMessage = createMockMessage();
            (cache.get as MockedAsyncFunction<typeof cache.get>).mockResolvedValueOnce({
                version: "1.0",
                validate: async () => true
            });

            const dbError = new Error("Database error");
            repository.save.mockRejectedValue(dbError);

            await expect(service.validateMessage(mockMessage)).rejects.toThrow(ValidationError);

            expect(logger.error).toHaveBeenCalledWith(
                "Message validation failed",
                expect.objectContaining({
                    error: expect.any(Error),
                    messageId: mockMessage.id
                })
            );
        });
    });
});
