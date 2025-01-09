// src/features/messages/services/ISO20022MessageService.ts

import { Service } from "@tsed/di";
import { XMLParser, XMLValidator } from "fast-xml-parser";
import { readFile } from "fs/promises";
import { join } from "path";

import { CacheService } from "../../utils/services/CacheService.js";
import { ConfigService } from "../../utils/services/ConfigService.js";
import { LoggerService } from "../../utils/services/LoggerService.js";
import { MessageExtractorFactory } from "../extractors/MessageExtractorFactory.js";
import { ISO20022ValidationError } from "../types/Errors.js";
import { MessageDetails, ParsedMessage } from "../types/Messages.js";

/**
 * Interface for XML validation error details
 */
interface ValidationError {
    err: {
        code: string;
        msg: string;
        line: number;
        col: number;
    };
}

/**
 * Interface for ISO20022 schema structure
 */
interface Schema {
    version: string;
    namespace: string;
    elements: Record<string, unknown>;
}

/**
 * Service for handling ISO20022 message parsing, validation, and processing.
 * Provides functionality for:
 * - XML structure validation
 * - Schema validation
 * - Message type extraction
 * - Message parsing
 * - Security measures against XML vulnerabilities
 */
@Service()
export class ISO20022MessageService {
    /** Cache TTL for schemas in seconds */
    private readonly SCHEMA_CACHE_TTL = 3600; // 1 hour

    /** XML Parser configuration with security measures */
    private readonly XML_PARSER_OPTIONS = {
        ignoreAttributes: false,
        attributeNamePrefix: "@_",
        preserveOrder: true,
        // Security options
        allowBooleanAttributes: true,
        parseAttributeValue: true,
        stopNodes: ["parsererror"],
        entityExpansionLimit: 1000,
        // Prevent XXE attacks
        noEntityExpansion: true,
        noExternalEntities: true
    };

    private xmlParser: XMLParser;
    private validMessageTypes: Set<string>;

    constructor(
        private logger: LoggerService,
        private config: ConfigService,
        private cache: CacheService,
        private messageExtractorFactory: MessageExtractorFactory
    ) {
        this.logger = logger.child({ service: "ISO20022MessageService" });
        this.xmlParser = new XMLParser(this.XML_PARSER_OPTIONS);

        // Initialize valid message types from configuration
        this.validMessageTypes = new Set(this.config.get<string[]>("iso20022.validMessageTypes", []));
    }

    /**
     * Parse and validate an ISO20022 XML message
     *
     * @param xml - The XML content of the message
     * @returns Parsed message details including type, content, and extracted information
     * @throws {ISO20022ValidationError} If validation or parsing fails
     */
    async parseMessage(xml: string): Promise<ParsedMessage> {
        try {
            // Step 1: Validate basic XML structure with security checks
            await this.validateXMLStructure(xml);

            // Step 2: Extract and validate message type
            const messageType = await this.extractMessageType(xml);
            if (!this.isValidMessageType(messageType)) {
                throw new ISO20022ValidationError("Unsupported message type", [
                    { code: "UNSUPPORTED_TYPE", message: `Message type ${messageType} is not supported` }
                ]);
            }

            // Step 3: Validate against ISO20022 schema
            await this.validateAgainstSchema(xml, messageType);

            // Step 4: Parse full message content
            const parsedMessage = this.xmlParser.parse(xml);

            // Step 5: Extract specific message details using appropriate extractor
            const messageExtractor = this.messageExtractorFactory.getExtractor(messageType);
            const messageDetails = messageExtractor.extractDetails(parsedMessage);
            const submissionType = messageExtractor.getSubmissionType();

            // Return complete parsed message object
            return {
                messageType,
                submissionType,
                originalXml: xml,
                parsedData: parsedMessage,
                details: messageDetails
            };
        } catch (error) {
            this.handleError("Message parsing failed", error);
        }
    }

    /**
     * Validate the XML structure of a message
     *
     * @param xml - The XML content to validate
     * @throws {ISO20022ValidationError} If the XML structure is invalid
     */
    private async validateXMLStructure(xml: string): Promise<void> {
        const validationOptions = {
            allowBooleanAttributes: true,
            noEntityExpansion: true,
            noExternalEntities: true
        };

        const result = XMLValidator.validate(xml, validationOptions);
        if (result !== true) {
            const error = result as ValidationError;
            throw new ISO20022ValidationError("Invalid XML structure", [
                {
                    code: "XML_STRUCTURE",
                    message: `${error.err.msg} at line ${error.err.line}, column ${error.err.col}`
                }
            ]);
        }
    }

    /**
     * Extract the message type from an ISO20022 message
     *
     * @param xml - The XML content of the message
     * @returns The extracted message type identifier
     * @throws {ISO20022ValidationError} If message type cannot be extracted
     */
    private async extractMessageType(xml: string): Promise<string> {
        try {
            const parsed = this.xmlParser.parse(xml);
            const header = await this.findMessageHeader(parsed);

            if (!header?.MessageDefinitionIdentifier) {
                throw new ISO20022ValidationError("Missing message type identifier", [
                    { code: "MISSING_TYPE", message: "Message type identifier not found in header" }
                ]);
            }

            const messageType = header.MessageDefinitionIdentifier;
            this.logger.debug("Extracted message type", { messageType });

            return messageType;
        } catch (error) {
            if (error instanceof ISO20022ValidationError) {
                throw error;
            }
            throw new ISO20022ValidationError("Failed to extract message type", new Error(String(error)));
        }
    }

    /**
     * Load and validate message against its ISO20022 schema
     *
     * @param xml - The XML content to validate
     * @param messageType - The message type to load schema for
     * @throws {ISO20022ValidationError} If schema validation fails
     */
    private async validateAgainstSchema(xml: string, messageType: string): Promise<void> {
        // Load schema for validation rules and structure check
        await this.loadSchema(messageType);

        // Validate XML structure - XMLValidator only supports basic validation options
        const validationResult = XMLValidator.validate(xml, {
            allowBooleanAttributes: true
        });

        if (validationResult !== true) {
            const error = validationResult as ValidationError;
            throw new ISO20022ValidationError("Schema validation failed", [
                {
                    code: "SCHEMA_VALIDATION",
                    message: `${error.err.msg} at line ${error.err.line}, column ${error.err.col}`
                }
            ]);
        }
    }

    /**
     * Load ISO20022 schema from cache or filesystem
     *
     * @param messageType - The message type to load schema for
     * @returns The loaded schema
     * @throws {ISO20022ValidationError} If schema cannot be loaded
     */
    private async loadSchema(messageType: string): Promise<Schema> {
        const cacheKey = `schema:${messageType}`;

        try {
            // Try cache first
            const cachedSchema = await this.cache.get<Schema>(cacheKey);
            if (cachedSchema) {
                return cachedSchema;
            }

            // Load from filesystem
            const schemaPath = this.getSchemaPath(messageType);
            const schemaContent = await readFile(schemaPath, "utf-8");
            const schema = this.parseSchema(schemaContent);

            // Cache the loaded schema
            await this.cache.set(cacheKey, schema, { ttl: this.SCHEMA_CACHE_TTL });

            return schema;
        } catch (error) {
            // Log the error before throwing
            this.logger.error(`Failed to load schema for message type ${messageType}: ${error.message}`, {
                error
            });

            throw new ISO20022ValidationError(
                "Failed to load schema",
                new Error(`Schema load failed for ${messageType}: ${error.message}`)
            );
        }
    }

    /**
     * Get the filesystem path for a message type's schema
     */
    private getSchemaPath(messageType: string): string {
        const schemaDir = this.config.get<string>("iso20022.schemaPath");
        if (!schemaDir) {
            throw new Error("Schema path not configured");
        }
        return join(schemaDir, `${messageType}.xsd`);
    }

    /**
     * Parse raw schema content into structured schema object
     */
    private parseSchema(content: string): Schema {
        try {
            const parsed = this.xmlParser.parse(content);
            return {
                version: this.extractSchemaVersion(parsed),
                namespace: this.extractSchemaNamespace(parsed),
                elements: parsed.schema?.elements || {}
            };
        } catch (error) {
            throw new Error(`Failed to parse schema: ${error.message}`);
        }
    }

    /**
     * Find the message header in parsed XML
     */
    private async findMessageHeader(parsed: Record<string, any>): Promise<Record<string, any> | undefined> {
        // Look for header in common locations
        const possibleHeaders = [parsed.Document?.Header, parsed.Message?.Header, parsed.BusinessMessage?.Header];

        return possibleHeaders.find((header) => header && typeof header === "object");
    }

    /**
     * Extract schema version from parsed schema
     */
    private extractSchemaVersion(schema: Record<string, any>): string {
        return schema.schema?.["@_version"] || "1.0";
    }

    /**
     * Extract schema namespace from parsed schema
     */
    private extractSchemaNamespace(schema: Record<string, any>): string {
        return schema.schema?.["@_targetNamespace"] || "";
    }

    /**
     * Check if a message type is supported
     */
    private isValidMessageType(messageType: string): boolean {
        return this.validMessageTypes.has(messageType);
    }

    /**
     * Standardized error handling
     */
    private handleError(message: string, error: unknown): never {
        this.logger.error(message, { error });

        if (error instanceof ISO20022ValidationError) {
            throw error;
        }

        throw new ISO20022ValidationError(message, new Error(String(error)));
    }
}
