// src/features/messages/services/DraftManagementService.ts

import { Inject, Service } from "@tsed/di";
import { Repository } from "typeorm";
import { ulid } from "ulid";

import { CacheService } from "../../utils/services/CacheService.js";
import { LoggerService } from "../../utils/services/LoggerService.js";
import { DraftStatus, MessageDraft } from "../models/MessageDraft.js";
import { ValidationError } from "../types/Errors.js";
import { ISO20022MessageService } from "./ISO20022MessageService.js";

@Service()
export class DraftManagementService {
    constructor(
        private logger: LoggerService,
        private cache: CacheService,
        private iso20022Service: ISO20022MessageService,
        @Inject("DATABASE_CONNECTION") private repository: Repository<MessageDraft>
    ) {
        this.logger = logger.child({ service: "DraftManagementService" });
    }

    /**
     * Create a new message draft
     */
    async createDraft(xml: string, metadata?: Record<string, any>): Promise<MessageDraft> {
        try {
            // Parse and validate the XML first
            const parsedMessage = await this.iso20022Service.parseMessage(xml);

            const draft = new MessageDraft();
            draft.id = ulid();
            draft.message_type = parsedMessage.messageType;
            draft.xml_payload = xml;
            draft.payload = parsedMessage.parsedData;
            draft.metadata = {
                ...metadata,
                source_system: metadata?.source_system || "default",
                custom_fields: metadata?.custom_fields || {}
            };
            draft.status = DraftStatus.INITIAL;
            draft.is_complete = false;
            draft.validation_issues = [];

            // Save the draft
            const savedDraft = await this.repository.save(draft);
            this.logger.info("Draft created successfully", { draftId: savedDraft.id });

            return savedDraft;
        } catch (error) {
            this.logger.error("Failed to create draft", { error });
            if (error instanceof ValidationError) {
                throw error;
            }
            throw new ValidationError("Failed to create message draft", [
                {
                    field: "xml",
                    message: error instanceof Error ? error.message : "Invalid message format"
                }
            ]);
        }
    }

    /**
     * Update an existing draft
     */
    async updateDraft(draftId: string, xml: string, metadata?: Record<string, any>): Promise<MessageDraft> {
        try {
            const draft = await this.repository.findOne({ where: { id: draftId } });
            if (!draft) {
                throw new ValidationError(`Draft not found: ${draftId}`);
            }

            // Parse and validate the new XML
            const parsedMessage = await this.iso20022Service.parseMessage(xml);

            // Update draft
            draft.xml_payload = xml;
            draft.payload = parsedMessage.parsedData;
            draft.message_type = parsedMessage.messageType;
            if (metadata) {
                draft.metadata = {
                    ...draft.metadata,
                    ...metadata,
                    custom_fields: {
                        ...(draft.metadata?.custom_fields || {}),
                        ...(metadata.custom_fields || {})
                    }
                };
            }

            // Update status to in progress if not already
            if (draft.status === DraftStatus.INITIAL) {
                draft.status = DraftStatus.IN_PROGRESS;
            }

            // Reset validation issues since content has changed
            draft.validation_issues = [];

            // Save updates
            const updatedDraft = await this.repository.save(draft);
            this.logger.info("Draft updated successfully", { draftId });

            return updatedDraft;
        } catch (error) {
            this.logger.error("Failed to update draft", { draftId, error });
            if (error instanceof ValidationError) {
                throw error;
            }
            throw new ValidationError("Failed to update message draft", [
                {
                    field: "xml",
                    message: error instanceof Error ? error.message : "Invalid message format"
                }
            ]);
        }
    }

    /**
     * Retrieve a draft by ID
     */
    async getDraft(draftId: string): Promise<MessageDraft> {
        const draft = await this.repository.findOne({ where: { id: draftId } });
        if (!draft) {
            throw new ValidationError(`Draft not found: ${draftId}`);
        }
        return draft;
    }

    /**
     * List drafts for an institution with optional filtering
     */
    async getDrafts(
        institutionId: string,
        options: { status?: DraftStatus; skip?: number; take?: number } = {}
    ): Promise<[MessageDraft[], number]> {
        try {
            const { status, skip = 0, take = 50 } = options;

            const queryBuilder = this.repository
                .createQueryBuilder("draft")
                .where("draft.institution_id = :institutionId", { institutionId });

            if (status) {
                queryBuilder.andWhere("draft.status = :status", { status });
            }

            // Add pagination
            queryBuilder.skip(skip).take(take);

            // Order by creation date, newest first
            queryBuilder.orderBy("draft.created_at", "DESC");

            // Execute query with count
            const [drafts, total] = await queryBuilder.getManyAndCount();

            this.logger.debug("Retrieved drafts", {
                institutionId,
                status,
                count: drafts.length,
                total
            });

            return [drafts, total];
        } catch (error) {
            this.logger.error("Failed to retrieve drafts", { institutionId, error });
            throw error;
        }
    }

    /**
     * Delete a draft
     */
    async deleteDraft(draftId: string): Promise<void> {
        try {
            const draft = await this.repository.findOne({ where: { id: draftId } });
            if (!draft) {
                throw new ValidationError(`Draft not found: ${draftId}`);
            }

            await this.repository.remove(draft);
            this.logger.info("Draft deleted successfully", { draftId });
        } catch (error) {
            this.logger.error("Failed to delete draft", { draftId, error });
            throw error;
        }
    }

    /**
     * Mark draft as complete
     */
    async completeDraft(draftId: string): Promise<MessageDraft> {
        try {
            const draft = await this.repository.findOne({ where: { id: draftId } });
            if (!draft) {
                throw new ValidationError(`Draft not found: ${draftId}`);
            }

            // Verify no validation issues exist
            if (this.hasValidationErrors(draft)) {
                throw new ValidationError("Cannot complete draft: validation issues exist");
            }

            draft.is_complete = true;
            draft.status = DraftStatus.COMPLETE;

            const updatedDraft = await this.repository.save(draft);
            this.logger.info("Draft marked as complete", { draftId });

            return updatedDraft;
        } catch (error) {
            this.logger.error("Failed to complete draft", { draftId, error });
            throw error;
        }
    }

    private hasValidationErrors(draft: MessageDraft): boolean {
        return draft.validation_issues?.some((issue) => issue.severity === "error") ?? false;
    }
}
