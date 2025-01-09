// src/features/messages/controllers/TransformationController.ts

import { Controller } from "@tsed/di";
import { BodyParams } from "@tsed/platform-params";
import { Description, Post, Returns, Summary } from "@tsed/schema";

import { LoggerService } from "../../utils/services/LoggerService.js";
import { TransformationType } from "../models/MessageTransformation.js";
import { ISO20022MessageService } from "../services/ISO20022MessageService.js";
import { TransformationError } from "../types/Errors.js";
import { TransformMessageDTO, TransformResultDTO } from "../types/MessageDTO.js";

/**
 * Controller handling message format transformations.
 *
 * Provides endpoints for transforming messages between different formats:
 * - ISO20022 to Protocol format
 * - ISO20022 to MT format
 * - Protocol format to ISO20022
 * - Format upgrades
 */
@Controller("/messages/transform")
export class TransformationController {
    constructor(
        private iso20022Service: ISO20022MessageService,
        private logger: LoggerService
    ) {
        this.logger = logger.child({ controller: "TransformationController" });
    }

    /**
     * Transform message between formats
     *
     * @param payload Transformation request with source message and target format
     * @returns Transformed message and transformation details
     * @throws TransformationError if transformation fails
     */
    @Post("/")
    @Summary("Transform message format")
    @Description("Transforms message between supported formats")
    @Returns(200, TransformResultDTO)
    async transformMessage(@BodyParams() payload: TransformMessageDTO): Promise<TransformResultDTO> {
        try {
            if (!payload.xml || !payload.targetFormat) {
                throw new TransformationError("Missing required fields: xml and targetFormat");
            }

            this.logger.debug("Starting message transformation", {
                xmlLength: payload.xml.length,
                targetFormat: payload.targetFormat
            });

            // Step 1: Parse source message
            const parsedMessage = await this.iso20022Service.parseMessage(payload.xml);

            this.logger.debug("Message parsed successfully", {
                sourceFormat: parsedMessage.messageType
            });

            // Step 2: Check if it's a format upgrade
            const isUpgrade = this.isFormatUpgrade(parsedMessage.messageType, payload.targetFormat);

            // Step 3: Validate transformation is supported
            if (!isUpgrade) {
                this.validateTransformationSupport(parsedMessage.messageType, payload.targetFormat);
            }

            // Step 4: Perform transformation
            const transformedMessage = await this.performTransformation(parsedMessage, payload.targetFormat);

            this.logger.info("Transformation completed", {
                sourceFormat: parsedMessage.messageType,
                targetFormat: payload.targetFormat
            });

            // Return as DTO instance
            return new TransformResultDTO(true, parsedMessage.messageType, payload.targetFormat, transformedMessage, {
                transformationType: this.determineTransformationType(parsedMessage.messageType, payload.targetFormat),
                timestamp: new Date()
            });
        } catch (error) {
            this.logger.error("Transformation failed", { error });
            throw new TransformationError("Message transformation failed", error as Error);
        }
    }

    /**
     * Validate if transformation between formats is supported
     */
    private validateTransformationSupport(sourceFormat: string, targetFormat: string): void {
        const supportedTransformations = new Map([
            ["pacs.008", ["protocol", "mt103", "pacs.008"]], // Add self-mapping for upgrades
            ["pacs.009", ["protocol", "mt202", "pacs.009"]], // Add self-mapping for upgrades
            ["camt.056", ["protocol", "mt192", "camt.056"]], // Add self-mapping for upgrades
            ["protocol", ["pacs.008", "pacs.009", "camt.056"]]
        ]);

        // Extract base formats for both source and target
        const baseSourceFormat = sourceFormat.split(".").slice(0, 2).join(".");
        const baseTargetFormat = targetFormat.split(".").slice(0, 2).join(".");

        const supportedTargets = supportedTransformations.get(baseSourceFormat);
        if (!supportedTargets?.includes(baseTargetFormat)) {
            throw new TransformationError(`Transformation from ${sourceFormat} to ${targetFormat} is not supported`);
        }
    }

    /**
     * Determine transformation type based on source and target formats
     */
    private determineTransformationType(sourceFormat: string, targetFormat: string): TransformationType {
        if (targetFormat === "protocol") {
            return TransformationType.ISO20022_TO_MT;
        }
        if (sourceFormat === "protocol") {
            return TransformationType.MT_TO_ISO20022;
        }
        if (this.isFormatUpgrade(sourceFormat, targetFormat)) {
            return TransformationType.FORMAT_UPGRADE;
        }
        return TransformationType.CUSTOM;
    }

    /**
     * Check if transformation is a format upgrade
     */
    private isFormatUpgrade(sourceFormat: string, targetFormat: string): boolean {
        const sourceBase = sourceFormat.split(".").slice(0, -1).join(".");
        const targetBase = targetFormat.split(".").slice(0, -1).join(".");

        if (sourceBase !== targetBase) {
            return false;
        }

        const sourceVersion = this.extractVersion(sourceFormat);
        const targetVersion = this.extractVersion(targetFormat);
        return sourceVersion !== null && targetVersion !== null && targetVersion > sourceVersion;
    }

    /**
     * Extract version number from format string
     */
    private extractVersion(format: string): number | null {
        const match = format.match(/\.(\d+)$/);
        return match ? parseInt(match[1]) : null;
    }

    /**
     * Perform the actual message transformation
     */
    private async performTransformation(parsedMessage: any, targetFormat: string): Promise<any> {
        switch (targetFormat) {
            case "protocol":
                return {}; // TODO: Implement protocol transformation
            case "mt103":
            case "mt202":
            case "mt192":
                return {}; // TODO: Implement MT transformation
            default:
                if (this.isFormatUpgrade(parsedMessage.messageType, targetFormat)) {
                    return {}; // TODO: Implement format upgrade
                }
                throw new TransformationError(`Unsupported target format: ${targetFormat}`);
        }
    }
}
