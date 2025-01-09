// src/features/messages/models/MessageValidation.ts

import { IsEnum, IsNotEmpty, IsOptional, IsUUID, ValidateNested } from "class-validator";
import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

import { User } from "../../auth/models/User.js";
import { Message } from "./Message.js";

/**
 * Validation Result Enum
 * Represents the possible outcomes of a message validation
 */
export enum ValidationResult {
    PASSED = "passed",
    FAILED = "failed",
    WARNING = "warning"
}

/**
 * Message Validation Entity
 *
 * Stores validation results for messages, including ISO20022 schema validation
 * and custom business rule validations.
 *
 * @remarks
 * - Immutable validation records
 * - Stores complete validation context and results
 * - Links to specific message version
 */
@Entity("message_validations")
@Index(["message_id", "version"])
export class MessageValidation {
    @PrimaryGeneratedColumn("uuid")
    @IsUUID()
    @IsOptional()
    id: string;

    @Column({ name: "validation_type", type: "varchar", length: 50 })
    @IsNotEmpty()
    validation_type: string;

    @Column({
        type: "enum",
        enum: ValidationResult,
        nullable: false,
        default: ValidationResult.FAILED
    })
    @IsEnum(ValidationResult)
    result: ValidationResult = ValidationResult.FAILED;

    @Column({ type: "jsonb" })
    @IsNotEmpty()
    details: {
        errors?: Array<{
            code: string;
            message: string;
            path?: string;
        }>;
        warnings?: Array<{
            code: string;
            message: string;
            path?: string;
        }>;
        context?: Record<string, any>;
    };

    @Column({ name: "schema_version", type: "varchar", length: 20, nullable: true })
    schema_version?: string;

    @Column({ name: "version", type: "integer" })
    @Index()
    version: number;

    // Relationships
    @ManyToOne(() => Message, (message) => message.validations, { nullable: false })
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

    // Note: No UpdateDateColumn as validations should be immutable
}
