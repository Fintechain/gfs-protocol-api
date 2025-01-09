// src/features/messages/models/Message.ts

import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, ValidateNested } from "class-validator";
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
    OneToMany,
    OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";

import { User } from "../../../features/auth/models/User.js";
import { Institution } from "../../../features/institutions/models/Institution.js";
import { MessageDraft } from "./MessageDraft.js";
import { MessageTransformation } from "./MessageTransformation.js";
import { MessageValidation } from "./MessageValidation.js";

/**
 * Message Status Enum - Updated to align with Protocol Coordinator states
 */
export enum MessageStatus {
    // Draft States
    DRAFT = "draft",

    // Validation States
    VALIDATING = "validating",
    VALIDATED = "validated",
    VALIDATION_FAILED = "validation_failed",

    // Protocol States
    PREPARING = "preparing", // Preparing for protocol submission
    READY = "ready", // Ready for protocol submission
    SUBMITTING = "submitting", // Being submitted to Protocol Coordinator

    // Protocol Coordinator States
    PENDING = "pending", // Accepted by Protocol Coordinator
    PROCESSING = "processing", // Being processed by Protocol
    CONFIRMED = "confirmed", // Confirmed on blockchain

    // Settlement States
    SETTLING = "settling", // Settlement in progress
    SETTLED = "settled", // Settlement completed

    // Terminal States
    COMPLETED = "completed", // Fully processed and settled
    FAILED = "failed", // Failed in processing
    REJECTED = "rejected", // Rejected by protocol
    CANCELLED = "cancelled" // Cancelled by user or system
}

/**
 * Protocol Submission Type
 */
export enum ProtocolSubmissionType {
    PACS_008 = "pacs.008", // Customer Credit Transfer
    PACS_009 = "pacs.009", // Financial Institution Credit Transfer
    CAMT_056 = "camt.056", // Payment Cancellation Request
    CAMT_029 = "camt.029" // Resolution Of Investigation
}

@Entity("messages")
@Index(["institution_id", "message_type"])
@Index(["protocol_message_id"], { unique: true, where: "protocol_message_id IS NOT NULL" })
export class Message {
    @PrimaryGeneratedColumn("uuid")
    @IsUUID()
    @IsOptional()
    id: string;

    // ISO20022 Message Details
    @Column({ name: "message_type", type: "varchar", length: 50 })
    @IsNotEmpty()
    @IsString()
    @Index()
    message_type: string;

    @Column({ type: "text" })
    @IsNotEmpty()
    xml_payload: string;

    @Column({ type: "jsonb" })
    @IsNotEmpty()
    parsed_payload: Record<string, any>;

    // Protocol Details
    @Column({ name: "protocol_message_id", type: "varchar", nullable: true })
    @IsOptional()
    @Index()
    protocol_message_id?: string;

    @Column({ name: "protocol_submission_type", type: "enum", enum: ProtocolSubmissionType })
    @IsEnum(ProtocolSubmissionType)
    protocol_submission_type: ProtocolSubmissionType;

    @Column({ type: "jsonb", nullable: true })
    @IsOptional()
    protocol_payload?: Record<string, any>;

    // Blockchain Details
    @Column({ name: "transaction_hash", type: "varchar", length: 66, nullable: true })
    @IsOptional()
    @Index()
    transaction_hash?: string;

    @Column({ name: "target_chain_id", type: "integer", nullable: true })
    @IsOptional()
    target_chain_id?: number;

    // In the Protocol Details section of Message entity
    @Column({ name: "target_address", type: "varchar", length: 42, nullable: true }) // 42 chars for ETH address
    @IsOptional()
    @IsString()
    target_address?: string;

    @Column({ name: "block_number", type: "bigint", nullable: true })
    @IsOptional()
    block_number?: string;

    @Column({ name: "block_timestamp", type: "timestamp", nullable: true })
    @IsOptional()
    block_timestamp?: Date;

    // Settlement Details
    @Column({ name: "settlement_id", type: "varchar", nullable: true })
    @IsOptional()
    settlement_id?: string;

    @Column({ type: "jsonb", nullable: true })
    @IsOptional()
    settlement_details?: {
        status: string;
        amount: string;
        currency: string;
        settlement_date: Date;
        settlement_reference?: string;
    };

    // Status and Tracking
    @Column({
        type: "enum",
        enum: MessageStatus,
        default: MessageStatus.DRAFT
    })
    @IsEnum(MessageStatus)
    status: MessageStatus;

    @Column({ name: "version", type: "integer", default: 1 })
    version: number;

    @Column({ type: "jsonb", nullable: true })
    @IsOptional()
    processing_metadata?: {
        retry_count?: number;
        last_error?: string;
        processing_steps?: Array<{
            step: string;
            timestamp: Date;
            status: string;
            details?: Record<string, any>;
        }>;
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

    @OneToMany(() => MessageValidation, (validation) => validation.message)
    validations: MessageValidation[];

    @OneToMany(() => MessageTransformation, (transformation) => transformation.message)
    transformations: MessageTransformation[];

    @OneToOne(() => MessageDraft, (draft) => draft.message)
    draft: MessageDraft;

    // Timestamps
    @CreateDateColumn({ name: "created_at" })
    created_at: Date;

    @UpdateDateColumn({ name: "updated_at" })
    updated_at: Date;

    @DeleteDateColumn({ name: "deleted_at" })
    deleted_at?: Date;

    /**
     * Check if message can be submitted to protocol
     */
    canSubmitToProtocol(): boolean {
        return this.status === MessageStatus.VALIDATED && !!this.protocol_submission_type && !this.protocol_message_id;
    }

    /**
     * Check if message requires settlement
     */
    requiresSettlement(): boolean {
        return [ProtocolSubmissionType.PACS_008, ProtocolSubmissionType.PACS_009].includes(this.protocol_submission_type);
    }

    /**
     * Get current processing step
     */
    getCurrentProcessingStep(): string | null {
        if (!this.processing_metadata?.processing_steps?.length) {
            return null;
        }
        return this.processing_metadata.processing_steps[this.processing_metadata.processing_steps.length - 1].step;
    }

    /**
     * Add processing step
     */
    addProcessingStep(step: string, status: string, details?: Record<string, any>) {
        if (!this.processing_metadata) {
            this.processing_metadata = {};
        }
        if (!this.processing_metadata.processing_steps) {
            this.processing_metadata.processing_steps = [];
        }
        this.processing_metadata.processing_steps.push({
            step,
            status,
            timestamp: new Date(),
            details
        });
    }
    @BeforeInsert()
    protected beforeInsert() {
        if (!this.version) {
            this.version = 1;
        }
    }

    @BeforeUpdate()
    protected beforeUpdate() {
        this.version++;
    }
}
