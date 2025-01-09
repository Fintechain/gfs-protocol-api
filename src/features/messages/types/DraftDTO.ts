// src/features/messages/dtos/DraftDTO.ts

/**
 * DTO for creating a new message draft
 */
export class CreateDraftDTO {
    /** ISO20022 XML message content */
    xml: string;

    /** Optional metadata for the draft */
    metadata?: {
        /** Source system identifier */
        source_system?: string;

        /** Reference number for external tracking */
        reference_number?: string;

        /** Optional tags for categorization */
        tags?: string[];

        /** Custom fields for additional data */
        custom_fields?: Record<string, any>;
    };
}

/**
 * DTO for updating an existing message draft
 */
export class UpdateDraftDTO extends CreateDraftDTO {}

/**
 * DTO for listing drafts with filters
 */
export class ListDraftsDTO {
    /** Optional status filter */
    status?: string;

    /** Number of records to skip (pagination) */
    skip?: number = 0;

    /** Number of records to take (pagination) */
    take?: number = 50;
}

/**
 * Response DTO for draft listing
 */
export class DraftListResponse {
    /** Array of draft messages */
    drafts: Array<{
        id: string;
        message_type: string;
        status: string;
        is_complete: boolean;
        created_at: Date;
        updated_at: Date;
    }>;

    /** Total count of drafts (for pagination) */
    total: number;

    constructor(drafts: any[], total: number) {
        this.drafts = drafts;
        this.total = total;
    }
}
