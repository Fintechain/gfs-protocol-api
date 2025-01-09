// src/features/messages/controllers/MessageDraftController.ts

import { Controller } from "@tsed/di";
import { BodyParams, PathParams } from "@tsed/platform-params";
import { Delete, Description, Get, Post, Put, Returns, Status, Summary } from "@tsed/schema";

import { LoggerService } from "../../utils/services/LoggerService.js";
import { MessageDraft } from "../models/MessageDraft.js";
import { DraftManagementService } from "../services/DraftManagementService.js";
import { CreateDraftDTO, DraftListResponse, ListDraftsDTO, UpdateDraftDTO } from "../types/DraftDTO.js";
import { ValidationError } from "../types/Errors.js";

/**
 * Controller handling message draft operations.
 *
 * Provides endpoints for creating, updating, and managing ISO20022 message drafts
 * before they are submitted to the protocol.
 */
@Controller("/messages/draft")
export class MessageDraftController {
    constructor(
        private draftService: DraftManagementService,
        private logger: LoggerService
    ) {
        this.logger = logger.child({ controller: "MessageDraftController" });
    }

    /**
     * Create a new message draft
     */
    @Post("/")
    @Summary("Create a new message draft")
    @Description("Creates a new draft from ISO20022 XML message with initial validation")
    @Returns(201, MessageDraft)
    @Status(201)
    async createDraft(@BodyParams() payload: CreateDraftDTO): Promise<MessageDraft> {
        try {
            this.logger.debug("Creating new draft", {
                xmlLength: payload.xml.length,
                metadata: payload.metadata
            });

            const draft = await this.draftService.createDraft(payload.xml, payload.metadata);

            this.logger.info("Draft created successfully", {
                draftId: draft.id,
                messageType: draft.message_type
            });

            return draft;
        } catch (error) {
            this.logger.error("Failed to create draft", { error });
            throw error;
        }
    }

    /**
     * Update an existing draft
     */
    @Put("/:draftId")
    @Summary("Update an existing message draft")
    @Description("Updates draft content and performs validation")
    @Returns(200, MessageDraft)
    async updateDraft(@PathParams("draftId") draftId: string, @BodyParams() payload: UpdateDraftDTO): Promise<MessageDraft> {
        try {
            this.logger.debug("Updating draft", {
                draftId,
                xmlLength: payload.xml.length,
                metadata: payload.metadata
            });

            const draft = await this.draftService.updateDraft(draftId, payload.xml, payload.metadata);

            this.logger.info("Draft updated successfully", {
                draftId: draft.id,
                status: draft.status,
                isComplete: draft.is_complete
            });

            return draft;
        } catch (error) {
            this.logger.error("Failed to update draft", { draftId, error });
            throw error;
        }
    }

    /**
     * Retrieve a draft by ID
     */
    @Get("/:draftId")
    @Summary("Get draft by ID")
    @Description("Retrieves detailed information about a specific draft")
    @Returns(200, MessageDraft)
    async getDraft(@PathParams("draftId") draftId: string): Promise<MessageDraft> {
        try {
            this.logger.debug("Retrieving draft", { draftId });

            const draft = await this.draftService.getDraft(draftId);

            this.logger.debug("Draft retrieved successfully", {
                draftId,
                status: draft.status
            });

            return draft;
        } catch (error) {
            this.logger.error("Failed to get draft", { draftId, error });
            throw error;
        }
    }

    /**
     * List drafts for an institution
     */
    @Get("/institution/:institutionId")
    @Summary("List institution drafts")
    @Description("Retrieves all drafts for a specific institution with optional filtering")
    @Returns(200, DraftListResponse)
    async listDrafts(@PathParams("institutionId") institutionId: string, @BodyParams() filters: ListDraftsDTO): Promise<DraftListResponse> {
        try {
            this.logger.debug("Listing drafts", {
                institutionId,
                ...filters
            });

            const [drafts, total] = await this.draftService.getDrafts(institutionId, filters);

            this.logger.debug("Drafts retrieved successfully", {
                count: drafts.length,
                total
            });

            return new DraftListResponse(drafts, total);
        } catch (error) {
            this.logger.error("Failed to list drafts", {
                institutionId,
                error
            });
            throw error;
        }
    }

    /**
     * Delete a draft
     */
    @Delete("/:draftId")
    @Summary("Delete a draft")
    @Description("Permanently deletes a draft message")
    @Status(204)
    async deleteDraft(@PathParams("draftId") draftId: string): Promise<void> {
        try {
            this.logger.debug("Deleting draft", { draftId });

            await this.draftService.deleteDraft(draftId);

            this.logger.info("Draft deleted successfully", { draftId });
        } catch (error) {
            this.logger.error("Failed to delete draft", { draftId, error });
            throw error;
        }
    }

    /**
     * Mark a draft as complete
     */
    @Post("/:draftId/complete")
    @Summary("Complete a draft")
    @Description("Marks a draft as complete after all validations pass")
    @Returns(200, MessageDraft)
    async completeDraft(@PathParams("draftId") draftId: string): Promise<MessageDraft> {
        try {
            this.logger.debug("Completing draft", { draftId });

            const draft = await this.draftService.completeDraft(draftId);

            this.logger.info("Draft marked as complete", {
                draftId,
                status: draft.status
            });

            return draft;
        } catch (error) {
            this.logger.error("Failed to complete draft", { draftId, error });
            throw error;
        }
    }
}
