// src/features/messages/services/__tests__/DraftManagementService.spec.ts

import { PlatformTest } from "@tsed/platform-http/testing";
import { beforeEach, describe, expect, it, Mock, vi } from "vitest";

import { CacheService } from "../../../utils/services/CacheService.js";
import { LoggerService } from "../../../utils/services/LoggerService.js";
import { DraftStatus, MessageDraft } from "../../models/MessageDraft.js";
import { ValidationError } from "../../types/Errors.js";
import { DraftManagementService } from "../DraftManagementService.js";

type MockedAsyncFunction<T extends (...args: any) => Promise<any>> = Mock;

describe("DraftManagementService", () => {
    let service: DraftManagementService;
    let logger: LoggerService;
    let cache: CacheService;
    let iso20022Service: { parseMessage: Mock };
    let repository: any;

    // Create a draft factory to ensure proper class instances
    const createDraft = (overrides = {}): MessageDraft => {
        const draft = new MessageDraft();
        draft.id = "test-draft-id";
        draft.message_type = "pacs.008";
        draft.xml_payload = "<xml>test</xml>";
        draft.payload = { test: "data" };
        draft.status = DraftStatus.INITIAL;
        draft.is_complete = false;
        draft.metadata = {
            source_system: "default",
            custom_fields: {}
        };
        draft.validation_issues = [];
        draft.created_at = new Date("2024-01-01");
        draft.updated_at = new Date("2024-01-01");
        return Object.assign(draft, overrides);
    };

    const mockParsedMessage = {
        messageType: "pacs.008",
        parsedData: { test: "data" },
        originalXml: "<xml>test</xml>"
    };

    beforeEach(async () => {
        // Create mock logger
        logger = {
            error: vi.fn(),
            warn: vi.fn(),
            info: vi.fn(),
            debug: vi.fn(),
            child: vi.fn().mockReturnThis()
        } as unknown as LoggerService;

        // Create mock cache service
        cache = {
            get: vi.fn(),
            set: vi.fn()
        } as unknown as CacheService;

        // Create mock ISO20022 service
        iso20022Service = {
            parseMessage: vi.fn().mockResolvedValue(mockParsedMessage)
        };

        // Create mock repository
        repository = {
            findOne: vi.fn(),
            save: vi.fn().mockImplementation((draft) => Promise.resolve(draft)),
            remove: vi.fn(),
            createQueryBuilder: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            andWhere: vi.fn().mockReturnThis(),
            skip: vi.fn().mockReturnThis(),
            take: vi.fn().mockReturnThis(),
            orderBy: vi.fn().mockReturnThis(),
            getManyAndCount: vi.fn()
        };

        // Create service instance
        service = new DraftManagementService(logger, cache, iso20022Service as any, repository);

        // Reset all mocks
        vi.clearAllMocks();
    });

    describe("createDraft", () => {
        it("should create draft successfully", async () => {
            const xml = "<xml>test</xml>";
            const metadata = { source_system: "test-system" };

            const result = await service.createDraft(xml, metadata);

            expect(result).toBeDefined();
            expect(result.xml_payload).toBe(xml);
            expect(result.status).toBe(DraftStatus.INITIAL);
            expect(result.metadata).toEqual({
                ...metadata,
                custom_fields: {}
            });
            expect(iso20022Service.parseMessage).toHaveBeenCalledWith(xml);
            expect(repository.save).toHaveBeenCalled();
            expect(logger.info).toHaveBeenCalledWith("Draft created successfully", expect.any(Object));
        });

        it("should handle parsing errors", async () => {
            const error = new Error("Parse error");
            iso20022Service.parseMessage.mockRejectedValue(error);

            await expect(service.createDraft("<xml>test</xml>")).rejects.toThrow(ValidationError);
            expect(logger.error).toHaveBeenCalledWith("Failed to create draft", { error });
        });
    });

    describe("updateDraft", () => {
        beforeEach(() => {
            repository.findOne.mockResolvedValue(createDraft());
        });

        it("should update draft successfully", async () => {
            const xml = "<xml>updated</xml>";
            const metadata = { source_system: "updated-system" };

            const result = await service.updateDraft("test-draft-id", xml, metadata);

            expect(result.xml_payload).toBe(xml);
            expect(result.status).toBe(DraftStatus.IN_PROGRESS);
            expect(result.metadata?.source_system).toBe("updated-system");
            expect(result.validation_issues).toEqual([]);
            expect(logger.info).toHaveBeenCalledWith("Draft updated successfully", { draftId: "test-draft-id" });
        });

        it("should handle draft not found", async () => {
            repository.findOne.mockResolvedValue(null);

            await expect(service.updateDraft("invalid-id", "<xml>test</xml>")).rejects.toThrow("Draft not found");
        });

        it("should merge metadata correctly", async () => {
            const existingDraft = createDraft({
                metadata: {
                    source_system: "original",
                    custom_fields: { field1: "value1" }
                }
            });
            repository.findOne.mockResolvedValue(existingDraft);

            const result = await service.updateDraft("test-draft-id", "<xml>test</xml>", {
                custom_fields: { field2: "value2" }
            });

            expect(result.metadata).toEqual({
                source_system: "original",
                custom_fields: {
                    field1: "value1",
                    field2: "value2"
                }
            });
        });
    });

    describe("getDraft", () => {
        it("should retrieve draft successfully", async () => {
            const mockDraft = createDraft();
            repository.findOne.mockResolvedValue(mockDraft);

            const result = await service.getDraft("test-draft-id");

            expect(result).toEqual(mockDraft);
            expect(repository.findOne).toHaveBeenCalledWith({ where: { id: "test-draft-id" } });
        });

        it("should handle draft not found", async () => {
            repository.findOne.mockResolvedValue(null);

            await expect(service.getDraft("invalid-id")).rejects.toThrow(ValidationError);
        });
    });

    describe("getDrafts", () => {
        beforeEach(() => {
            repository.getManyAndCount.mockResolvedValue([[createDraft()], 1]);
        });

        it("should list drafts with pagination", async () => {
            const result = await service.getDrafts("inst-123", { status: DraftStatus.INITIAL, skip: 0, take: 10 });

            expect(result).toEqual([[expect.any(MessageDraft)], 1]);
            expect(repository.createQueryBuilder).toHaveBeenCalled();
            expect(repository.skip).toHaveBeenCalledWith(0);
            expect(repository.take).toHaveBeenCalledWith(10);
        });

        it("should apply status filter when provided", async () => {
            await service.getDrafts("inst-123", { status: DraftStatus.IN_PROGRESS });

            expect(repository.andWhere).toHaveBeenCalledWith("draft.status = :status", { status: DraftStatus.IN_PROGRESS });
        });

        it("should handle database errors", async () => {
            const error = new Error("Database error");
            repository.getManyAndCount.mockRejectedValue(error);

            await expect(service.getDrafts("inst-123")).rejects.toThrow();
            expect(logger.error).toHaveBeenCalledWith("Failed to retrieve drafts", expect.any(Object));
        });
    });

    describe("deleteDraft", () => {
        it("should delete draft successfully", async () => {
            repository.findOne.mockResolvedValue(createDraft());

            await service.deleteDraft("test-draft-id");

            expect(repository.remove).toHaveBeenCalled();
            expect(logger.info).toHaveBeenCalledWith("Draft deleted successfully", { draftId: "test-draft-id" });
        });

        it("should handle draft not found", async () => {
            repository.findOne.mockResolvedValue(null);

            await expect(service.deleteDraft("invalid-id")).rejects.toThrow(ValidationError);
        });
    });

    describe("completeDraft", () => {
        it("should complete draft successfully", async () => {
            const mockDraft = createDraft();
            repository.findOne.mockResolvedValue(mockDraft);

            const result = await service.completeDraft("test-draft-id");

            expect(result.is_complete).toBe(true);
            expect(result.status).toBe(DraftStatus.COMPLETE);
            expect(logger.info).toHaveBeenCalledWith("Draft marked as complete", { draftId: "test-draft-id" });
        });

        it("should prevent completion with validation errors", async () => {
            const draftWithErrors = createDraft({
                validation_issues: [{ severity: "error", message: "Test error" }]
            });
            repository.findOne.mockResolvedValue(draftWithErrors);

            await expect(service.completeDraft("test-draft-id")).rejects.toThrow(ValidationError);
        });

        it("should handle draft not found", async () => {
            repository.findOne.mockResolvedValue(null);

            await expect(service.completeDraft("invalid-id")).rejects.toThrow(ValidationError);
        });
    });
});
