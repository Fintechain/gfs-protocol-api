// src/features/messages/services/__tests__/ISO20022MessageService.spec.ts

import { PlatformTest } from "@tsed/platform-http/testing";
import { beforeEach, describe, expect, it, Mock, vi } from "vitest";

// Mock fs/promises module before imports
vi.mock("fs/promises", () => ({
    readFile: vi.fn().mockResolvedValue("<schema>test</schema>")
}));

// Mock fast-xml-parser
vi.mock("fast-xml-parser", () => ({
    XMLParser: vi.fn().mockImplementation(() => ({
        parse: vi.fn().mockReturnValue({
            Document: {
                Header: {
                    MessageDefinitionIdentifier: "pacs.008.001.08"
                }
            }
        })
    })),
    XMLValidator: {
        validate: vi.fn().mockReturnValue(true)
    }
}));

// Import after mocks
import { fail } from "assert";
import { XMLParser, XMLValidator } from "fast-xml-parser";
import { readFile } from "fs/promises";

import { CacheService } from "../../../utils/services/CacheService.js";
import { ConfigService } from "../../../utils/services/ConfigService.js";
import { LoggerService } from "../../../utils/services/LoggerService.js";
import { MessageExtractorFactory } from "../../extractors/MessageExtractorFactory.js";
import { ProtocolSubmissionType } from "../../models/Message.js";
import { ISO20022ValidationError } from "../../types/Errors.js";
import { ISO20022MessageService } from "../ISO20022MessageService.js";

describe("ISO20022MessageService", () => {
    let service: ISO20022MessageService;
    let logger: LoggerService;
    let config: ConfigService;
    let cache: CacheService;
    let messageExtractorFactory: MessageExtractorFactory;
    let readFileMock: Mock;
    let validateMock: Mock;

    const mockValidXML = `
        <?xml version="1.0" encoding="UTF-8"?>
        <Document xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.008.001.08">
            <Header>
                <MessageDefinitionIdentifier>pacs.008.001.08</MessageDefinitionIdentifier>
            </Header>
            <Body>
                <test>data</test>
            </Body>
        </Document>
    `;

    const mockExtractor = {
        extractDetails: vi.fn().mockReturnValue({
            messageId: "test-id",
            creationDate: new Date(),
            amount: "100",
            currency: "USD",
            debtorAgent: "TESTBANK",
            creditorAgent: "TESTBANK"
        }),
        getSubmissionType: vi.fn().mockReturnValue(ProtocolSubmissionType.PACS_008)
    };

    beforeEach(async () => {
        // Get mock references
        readFileMock = readFile as Mock;
        validateMock = XMLValidator.validate as Mock;

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

        (config.get as Mock).mockImplementation((key: string) => {
            switch (key) {
                case "iso20022.validMessageTypes":
                    return ["pacs.008.001.08"];
                case "iso20022.schemaPath":
                    return "/schemas";
                default:
                    return null;
            }
        });

        // Create mock cache
        cache = {
            get: vi.fn(),
            set: vi.fn()
        } as unknown as CacheService;

        // Create mock message extractor factory
        messageExtractorFactory = {
            getExtractor: vi.fn().mockReturnValue(mockExtractor)
        } as unknown as MessageExtractorFactory;

        // Create service instance
        service = new ISO20022MessageService(logger, config, cache, messageExtractorFactory);

        // Reset all mocks
        vi.clearAllMocks();
    });

    describe("parseMessage", () => {
        it("should successfully parse and validate a valid message", async () => {
            const result = await service.parseMessage(mockValidXML);

            expect(result).toBeDefined();
            expect(result.messageType).toBe("pacs.008.001.08");
            expect(result.submissionType).toBe(ProtocolSubmissionType.PACS_008);
            expect(result.originalXml).toBe(mockValidXML);
            expect(result.details).toEqual(
                expect.objectContaining({
                    messageId: "test-id",
                    amount: "100",
                    currency: "USD"
                })
            );

            expect(validateMock).toHaveBeenCalled();
            expect(messageExtractorFactory.getExtractor).toHaveBeenCalledWith("pacs.008.001.08");
            expect(mockExtractor.extractDetails).toHaveBeenCalled();
            expect(mockExtractor.getSubmissionType).toHaveBeenCalled();
        });

        it("should handle invalid XML structure", async () => {
            validateMock.mockReturnValueOnce({
                err: {
                    code: "InvalidXML",
                    msg: "XML parsing error",
                    line: 1,
                    col: 1
                }
            });

            await expect(service.parseMessage("<invalid>xml")).rejects.toThrow(ISO20022ValidationError);
            expect(logger.error).toHaveBeenCalledWith("Message parsing failed", expect.any(Object));
        });

        it("should handle unsupported message types", async () => {
            (config.get as Mock).mockReturnValueOnce(["other.type"]);

            await expect(service.parseMessage(mockValidXML)).rejects.toThrow(ISO20022ValidationError);
            expect(logger.error).toHaveBeenCalled();
        });
    });

    describe("Schema Management", () => {
        const mockSchema = {
            version: "1.0",
            namespace: "test",
            elements: {}
        };

        it("should use cached schema when available", async () => {
            (cache.get as Mock).mockResolvedValue(mockSchema);

            const schema = await service["loadSchema"]("pacs.008.001.08");

            expect(schema).toEqual(mockSchema);
            expect(cache.get).toHaveBeenCalledWith("schema:pacs.008.001.08");
            expect(cache.set).not.toHaveBeenCalled();
        });

        it("should load and cache schema when not cached", async () => {
            (cache.get as Mock).mockResolvedValue(null);

            await service["loadSchema"]("pacs.008.001.08");

            expect(cache.set).toHaveBeenCalledWith("schema:pacs.008.001.08", expect.any(Object), { ttl: 3600 });
        });

        it("should handle schema loading errors", async () => {
            (cache.get as Mock).mockResolvedValue(null);
            const error = new Error("Schema load error");
            readFileMock.mockRejectedValueOnce(error);

            try {
                await service["loadSchema"]("pacs.008.001.08");
                fail("Expected an error to be thrown");
            } catch (e) {
                expect(e).toBeInstanceOf(ISO20022ValidationError);
                expect(logger.error).toHaveBeenCalledWith(`Failed to load schema for message type pacs.008.001.08: ${error.message}`, {
                    error
                });
            }
        });
    });

    describe("Error Handling", () => {
        it("should handle message extractor errors", async () => {
            const error = new Error("Failed to get extractor");
            (messageExtractorFactory.getExtractor as any).mockImplementationOnce(() => {
                throw error;
            });

            await expect(service.parseMessage(mockValidXML)).rejects.toThrow(ISO20022ValidationError);
            expect(logger.error).toHaveBeenCalled();
        });

        it("should handle schema validation errors gracefully", async () => {
            validateMock.mockReturnValueOnce({
                err: {
                    code: "SchemaError",
                    msg: "Schema validation failed",
                    line: 1,
                    col: 1
                }
            });

            await expect(service.parseMessage(mockValidXML)).rejects.toThrow(ISO20022ValidationError);
            expect(logger.error).toHaveBeenCalled();
        });

        it("should handle extractor errors", async () => {
            const error = new Error("Extraction failed");
            mockExtractor.extractDetails.mockImplementationOnce(() => {
                throw error;
            });

            await expect(service.parseMessage(mockValidXML)).rejects.toThrow(ISO20022ValidationError);
            expect(logger.error).toHaveBeenCalled();
        });
    });

    describe("Configuration", () => {
        it("should handle missing schema path configuration", async () => {
            (config.get as Mock).mockReturnValue(null);

            try {
                await service["getSchemaPath"]("test");
                fail("Expected an error to be thrown");
            } catch (e) {
                expect(e.message).toBe("Schema path not configured");
                expect(config.get).toHaveBeenCalledWith("iso20022.schemaPath");
            }
        });

        it("should initialize with empty valid message types if not configured", () => {
            (config.get as Mock).mockReturnValue(null);

            const newService = new ISO20022MessageService(logger, config, cache, messageExtractorFactory);

            expect(newService["validMessageTypes"].size).toBe(0);
        });
    });
});
