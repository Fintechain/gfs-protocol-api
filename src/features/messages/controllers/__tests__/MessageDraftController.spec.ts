// src/features/messages/controllers/__tests__/MessageDraftController.spec.ts

import { beforeEach, describe, expect, it, Mock, vi } from "vitest";

import { LoggerService } from "../../../utils/services/LoggerService.js";
import { DraftStatus, MessageDraft } from "../../models/MessageDraft.js";
import { CreateDraftDTO, DraftListResponse, ListDraftsDTO, UpdateDraftDTO } from "../../types/DraftDTO.js";
import { ValidationError } from "../../types/Errors.js";
import { MessageDraftController } from "../MessageDraftController.js";

describe("MessageDraftController", () => {
    let controller: MessageDraftController;
    let draftService: {
        createDraft: Mock;
        updateDraft: Mock;
        getDraft: Mock;
        getDrafts: Mock;
        deleteDraft: Mock;
        completeDraft: Mock;
    };
    let logger: LoggerService;

    // Helper to create a mock draft
    const createMockDraft = (overrides = {}): MessageDraft => {
        const draft = new MessageDraft();
        draft.id = "test-draft-id";
        draft.message_type = "pacs.008";
        draft.xml_payload = "<xml>test</xml>";
        draft.payload = { test: "data" };
        draft.status = DraftStatus.INITIAL;
        draft.is_complete = false;
        draft.metadata = {
            source_system: "test-system",
            custom_fields: {}
        };
        draft.created_at = new Date("2024-01-01");
        draft.updated_at = new Date("2024-01-01");
        return Object.assign(draft, overrides);
    };

    beforeEach(() => {
        // Create mock services
        draftService = {
            createDraft: vi.fn(),
            updateDraft: vi.fn(),
            getDraft: vi.fn(),
            getDrafts: vi.fn(),
            deleteDraft: vi.fn(),
            completeDraft: vi.fn()
        };

        logger = {
            error: vi.fn(),
            warn: vi.fn(),
            info: vi.fn(),
            debug: vi.fn(),
            child: vi.fn().mockReturnThis()
        } as unknown as LoggerService;

        // Create controller instance
        controller = new MessageDraftController(draftService as any, logger);

        // Reset all mocks
        vi.clearAllMocks();
    });

    describe("createDraft", () => {
        const mockPayload = new CreateDraftDTO();
        mockPayload.xml = "<xml>test</xml>";
        mockPayload.metadata = {
            source_system: "test-system",
            custom_fields: {}
        };

        it("should create draft successfully", async () => {
            const mockDraft = createMockDraft();
            draftService.createDraft.mockResolvedValue(mockDraft);

            const result = await controller.createDraft(mockPayload);

            expect(result).toEqual(mockDraft);
            expect(draftService.createDraft).toHaveBeenCalledWith(mockPayload.xml, mockPayload.metadata);
            expect(logger.info).toHaveBeenCalledWith("Draft created successfully", expect.any(Object));
        });

        it("should handle validation errors", async () => {
            draftService.createDraft.mockRejectedValue(new ValidationError("Invalid XML"));

            await expect(controller.createDraft(mockPayload)).rejects.toThrow(ValidationError);
            expect(logger.error).toHaveBeenCalledWith("Failed to create draft", expect.any(Object));
        });
    });

    describe("updateDraft", () => {
        const mockPayload = new UpdateDraftDTO();
        mockPayload.xml = "<xml>updated</xml>";
        mockPayload.metadata = {
            source_system: "test-system",
            custom_fields: { updated: true }
        };

        it("should update draft successfully", async () => {
            const mockDraft = createMockDraft({
                xml_payload: mockPayload.xml,
                status: DraftStatus.IN_PROGRESS
            });
            draftService.updateDraft.mockResolvedValue(mockDraft);

            const result = await controller.updateDraft("test-draft-id", mockPayload);

            expect(result).toEqual(mockDraft);
            expect(draftService.updateDraft).toHaveBeenCalledWith("test-draft-id", mockPayload.xml, mockPayload.metadata);
            expect(logger.info).toHaveBeenCalledWith("Draft updated successfully", expect.any(Object));
        });

        it("should handle draft not found", async () => {
            draftService.updateDraft.mockRejectedValue(new ValidationError("Draft not found"));

            await expect(controller.updateDraft("test-draft-id", mockPayload)).rejects.toThrow(ValidationError);
            expect(logger.error).toHaveBeenCalledWith("Failed to update draft", expect.any(Object));
        });
    });

    describe("getDraft", () => {
        it("should retrieve draft successfully", async () => {
            const mockDraft = createMockDraft();
            draftService.getDraft.mockResolvedValue(mockDraft);

            const result = await controller.getDraft("test-draft-id");

            expect(result).toEqual(mockDraft);
            expect(draftService.getDraft).toHaveBeenCalledWith("test-draft-id");
            expect(logger.debug).toHaveBeenCalledWith("Draft retrieved successfully", expect.any(Object));
        });

        it("should handle draft not found", async () => {
            draftService.getDraft.mockRejectedValue(new ValidationError("Draft not found"));

            await expect(controller.getDraft("invalid-id")).rejects.toThrow(ValidationError);
            expect(logger.error).toHaveBeenCalledWith("Failed to get draft", expect.any(Object));
        });
    });

    describe("listDrafts", () => {
        const mockFilters = new ListDraftsDTO();
        mockFilters.status = DraftStatus.IN_PROGRESS;
        mockFilters.skip = 0;
        mockFilters.take = 10;

        it("should list drafts successfully", async () => {
            const mockDrafts = [createMockDraft(), createMockDraft()];
            draftService.getDrafts.mockResolvedValue([mockDrafts, 2]);

            const result = await controller.listDrafts("test-institution", mockFilters);

            expect(result).toBeInstanceOf(DraftListResponse);
            expect(result.drafts).toHaveLength(2);
            expect(result.total).toBe(2);
            expect(draftService.getDrafts).toHaveBeenCalledWith("test-institution", mockFilters);
            expect(logger.debug).toHaveBeenCalledWith("Drafts retrieved successfully", expect.any(Object));
        });

        it("should handle empty results", async () => {
            draftService.getDrafts.mockResolvedValue([[], 0]);

            const result = await controller.listDrafts("test-institution", mockFilters);

            expect(result.drafts).toHaveLength(0);
            expect(result.total).toBe(0);
        });

        it("should handle listing errors", async () => {
            draftService.getDrafts.mockRejectedValue(new Error("Database error"));

            await expect(controller.listDrafts("test-institution", mockFilters)).rejects.toThrow();
            expect(logger.error).toHaveBeenCalledWith("Failed to list drafts", expect.any(Object));
        });
    });

    describe("deleteDraft", () => {
        it("should delete draft successfully", async () => {
            draftService.deleteDraft.mockResolvedValue(undefined);

            await controller.deleteDraft("test-draft-id");

            expect(draftService.deleteDraft).toHaveBeenCalledWith("test-draft-id");
            expect(logger.info).toHaveBeenCalledWith("Draft deleted successfully", expect.any(Object));
        });

        it("should handle delete errors", async () => {
            draftService.deleteDraft.mockRejectedValue(new ValidationError("Cannot delete draft"));

            await expect(controller.deleteDraft("test-draft-id")).rejects.toThrow(ValidationError);
            expect(logger.error).toHaveBeenCalledWith("Failed to delete draft", expect.any(Object));
        });
    });

    describe("completeDraft", () => {
        it("should complete draft successfully", async () => {
            const mockDraft = createMockDraft({
                status: DraftStatus.COMPLETE,
                is_complete: true
            });
            draftService.completeDraft.mockResolvedValue(mockDraft);

            const result = await controller.completeDraft("test-draft-id");

            expect(result).toEqual(mockDraft);
            expect(result.is_complete).toBe(true);
            expect(result.status).toBe(DraftStatus.COMPLETE);
            expect(draftService.completeDraft).toHaveBeenCalledWith("test-draft-id");
            expect(logger.info).toHaveBeenCalledWith("Draft marked as complete", expect.any(Object));
        });

        it("should handle completion errors due to validation issues", async () => {
            draftService.completeDraft.mockRejectedValue(
                new ValidationError("Cannot complete draft", [{ field: "validation", message: "Validation issues exist" }])
            );

            await expect(controller.completeDraft("test-draft-id")).rejects.toThrow(ValidationError);
            expect(logger.error).toHaveBeenCalledWith("Failed to complete draft", expect.any(Object));
        });

        it("should handle draft not found during completion", async () => {
            draftService.completeDraft.mockRejectedValue(new ValidationError("Draft not found"));

            await expect(controller.completeDraft("invalid-id")).rejects.toThrow(ValidationError);
            expect(logger.error).toHaveBeenCalledWith("Failed to complete draft", expect.any(Object));
        });
    });
});
