// src/features/messages/models/MessageDraft.ts

import { IsNotEmpty, IsOptional, IsString, IsUUID, ValidateNested } from "class-validator";
import {
    BeforeInsert,
    BeforeUpdate,
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";

import { User } from "../../auth/models/User.js";
import { Institution } from "../../institutions/models/Institution.js";
import { Message } from "./Message.js";

/**
 * Draft Status Enum
 * Represents the current state of a draft message
 */
export enum DraftStatus {
    INITIAL = "initial",
    IN_PROGRESS = "in_progress",
    COMPLETE = "complete",
    CONVERTED = "converted",
    DISCARDED = "discarded"
}

/**
 * Message Draft Entity
 *
 * Represents a draft message before it's finalized into a complete message.
 * Stores temporary message data during the creation process.
 *
 * @remarks
 * - Drafts are soft-deleted when converted to messages
 * - Supports partial message creation
 * - Maintains audit trail
 * - Tracks completion status
 * - Stores validation issues during draft creation
 */
@Entity("message_drafts")
@Index(["institution_id", "message_type"])
export class MessageDraft {
    @PrimaryGeneratedColumn("uuid")
    @IsUUID()
    @IsOptional()
    id: string;

    @Column({ name: "message_type", type: "varchar", length: 50 })
    @IsNotEmpty()
    @IsString()
    @Index()
    message_type: string;

    @Column({ type: "jsonb", nullable: true })
    @IsOptional()
    payload?: Record<string, any>;

    @Column({ type: "text", nullable: true })
    @IsOptional()
    xml_payload?: string;

    // Fix status initialization
    @Column({
        type: "enum",
        enum: DraftStatus,
        default: DraftStatus.INITIAL,
        nullable: false
    })
    status: DraftStatus = DraftStatus.INITIAL;

    @Column({ name: "is_complete", type: "boolean", default: false })
    is_complete: boolean;

    @Column({ type: "jsonb", nullable: true })
    @IsOptional()
    validation_issues?: Array<{
        field: string;
        code: string;
        message: string;
        severity: "error" | "warning";
    }>;

    @Column({ type: "jsonb", nullable: true })
    @IsOptional()
    metadata?: {
        source_system?: string;
        reference_number?: string;
        tags?: string[];
        custom_fields?: Record<string, any>;
    };

    // Relationships
    @ManyToOne(() => Institution, { nullable: false })
    @JoinColumn({ name: "institution_id" })
    @ValidateNested()
    institution: Institution;

    @Column({ name: "institution_id" })
    @IsUUID()
    institution_id: string;

    @ManyToOne(() => User, { nullable: false })
    @JoinColumn({ name: "created_by" })
    @ValidateNested()
    created_by_user: User;

    @Column({ name: "created_by" })
    @IsUUID()
    created_by: string;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: "updated_by" })
    @ValidateNested()
    updated_by_user?: User;

    @Column({ name: "updated_by", nullable: true })
    @IsUUID()
    @IsOptional()
    updated_by?: string;

    @OneToOne(() => Message, (message) => message.draft)
    @JoinColumn({ name: "message_id" })
    message?: Message;

    @Column({ name: "message_id", nullable: true })
    @IsUUID()
    @IsOptional()
    message_id?: string;

    // Timestamps
    @CreateDateColumn({ name: "created_at" })
    created_at: Date;

    @UpdateDateColumn({ name: "updated_at" })
    updated_at: Date;

    @DeleteDateColumn({ name: "deleted_at" })
    deleted_at?: Date;

    // Expiration timestamp for auto-cleanup of abandoned drafts
    @Column({ name: "expires_at", type: "timestamp", nullable: true })
    @IsOptional()
    expires_at?: Date;

    // Hooks
    @BeforeInsert()
    protected beforeInsert() {
        // Set default expiration if not set (e.g., 24 hours from creation)
        if (!this.expires_at) {
            const expirationHours = process.env.DRAFT_EXPIRATION_HOURS || "24";
            this.expires_at = new Date(Date.now() + parseInt(expirationHours) * 60 * 60 * 1000);
        }
    }

    @BeforeUpdate()
    protected beforeUpdate() {
        // Update status based on completion
        if (this.is_complete && this.status === DraftStatus.IN_PROGRESS) {
            this.status = DraftStatus.COMPLETE;
        }
    }

    /**
     * Validates if the draft can be converted to a message
     * @returns Array of validation issues or empty array if valid
     */
    public validateForConversion(): Array<{ code: string; message: string }> {
        const issues: Array<{ code: string; message: string }> = [];

        if (!this.is_complete) {
            issues.push({
                code: "INCOMPLETE_DRAFT",
                message: "Draft is not marked as complete"
            });
        }

        if (this.validation_issues?.some((issue) => issue.severity === "error")) {
            issues.push({
                code: "VALIDATION_ERRORS",
                message: "Draft has unresolved validation errors"
            });
        }

        if (this.status === DraftStatus.CONVERTED) {
            issues.push({
                code: "ALREADY_CONVERTED",
                message: "Draft has already been converted to a message"
            });
        }

        if (this.status === DraftStatus.DISCARDED) {
            issues.push({
                code: "DISCARDED_DRAFT",
                message: "Cannot convert a discarded draft"
            });
        }

        return issues;
    }
}
