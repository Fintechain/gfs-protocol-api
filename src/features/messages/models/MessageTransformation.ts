// src/features/messages/models/MessageTransformation.ts

import { IsEnum, IsNotEmpty, IsOptional, IsUUID, ValidateNested } from "class-validator";
import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

import { User } from "../../auth/models/User.js";
import { Message } from "./Message.js";

/**
 * Transformation Type Enum
 * Defines the different types of message transformations
 */
export enum TransformationType {
    ISO20022_TO_MT = "iso20022_to_mt",
    MT_TO_ISO20022 = "mt_to_iso20022",
    FORMAT_UPGRADE = "format_upgrade",
    CUSTOM = "custom"
}

/**
 * Transformation Status Enum
 * Represents the status of a transformation
 */
export enum TransformationStatus {
    SUCCESS = "success",
    FAILED = "failed",
    PARTIAL = "partial"
}

/**
 * Message Transformation Entity
 *
 * Records message format transformations and their results.
 * Supports tracking of various transformation types and maintains
 * both source and target formats.
 *
 * @remarks
 * - Immutable transformation records
 * - Stores complete transformation context
 * - Links to specific message version
 */
@Entity("message_transformations")
@Index(["message_id", "version"])
export class MessageTransformation {
    @PrimaryGeneratedColumn("uuid")
    @IsUUID()
    @IsOptional()
    id: string;

    @Column({
        name: "transformation_type",
        type: "enum",
        enum: TransformationType
    })
    @IsEnum(TransformationType)
    transformation_type: TransformationType;

    @Column({
        type: "enum",
        enum: TransformationStatus,
        nullable: false,
        default: TransformationStatus.FAILED
    })
    @IsEnum(TransformationStatus)
    status: TransformationStatus = TransformationStatus.FAILED;

    @Column({ name: "source_format", type: "varchar", length: 50 })
    @IsNotEmpty()
    source_format: string;

    @Column({ name: "target_format", type: "varchar", length: 50 })
    @IsNotEmpty()
    target_format: string;

    @Column({ name: "source_version", type: "varchar", length: 20 })
    @IsNotEmpty()
    source_version: string;

    @Column({ name: "target_version", type: "varchar", length: 20 })
    @IsNotEmpty()
    target_version: string;

    @Column({ type: "jsonb", nullable: true })
    source_payload?: Record<string, any>;

    @Column({ type: "jsonb", nullable: true })
    target_payload?: Record<string, any>;

    @Column({ type: "text", nullable: true })
    source_xml?: string;

    @Column({ type: "text", nullable: true })
    target_xml?: string;

    @Column({ type: "jsonb" })
    @IsNotEmpty()
    transformation_details: {
        rules_applied: string[];
        mappings?: Record<string, string>;
        errors?: Array<{
            code: string;
            message: string;
            field?: string;
        }>;
        warnings?: Array<{
            code: string;
            message: string;
            field?: string;
        }>;
    };

    @Column({ name: "version", type: "integer" })
    @Index()
    version: number;

    // Relationships
    @ManyToOne(() => Message, (message) => message.transformations, { nullable: false })
    @JoinColumn({ name: "message_id" })
    @ValidateNested()
    message: Message;

    @Column({ name: "message_id" })
    @IsUUID()
    message_id: string;

    @ManyToOne(() => User, { nullable: false })
    @JoinColumn({ name: "performed_by" })
    @ValidateNested()
    performed_by_user: User;

    @Column({ name: "performed_by" })
    @IsUUID()
    performed_by: string;

    // Timestamp
    @CreateDateColumn({ name: "created_at" })
    created_at: Date;

    // Note: No UpdateDateColumn as transformations should be immutable
}
