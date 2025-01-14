// src/institutions/models/InstitutionConfig.ts

import { IsNotEmpty, IsOptional, IsString, IsUUID, ValidateNested } from "class-validator";
import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
    VersionColumn
} from "typeorm";

import { User } from "../../auth/models/User.js";
import { Institution } from "./Institution.js";

/**
 * Config Status Enum
 * Represents the current status of a configuration
 */
export enum ConfigStatus {
    DRAFT = "draft",
    ACTIVE = "active",
    INACTIVE = "inactive",
    PENDING_APPROVAL = "pending_approval"
}

/**
 * Config Type Enum
 * Defines different types of institution configurations
 */
export enum ConfigType {
    MESSAGING = "messaging",
    BLOCKCHAIN = "blockchain",
    COMPLIANCE = "compliance",
    OPERATIONS = "operations",
    SECURITY = "security"
}

/**
 * Institution Configuration Entity
 *
 * Represents a configuration profile for an institution.
 * Supports versioning and approval workflows for configuration changes.
 *
 * @remarks
 * - Maintains configuration history through versioning
 * - Supports approval workflow for changes
 * - Allows multiple active configurations per type
 */
@Entity("institution_configs")
@Index(["institution_id", "type", "version"])
export class InstitutionConfig {
    @PrimaryGeneratedColumn("uuid")
    @IsUUID()
    @IsOptional()
    id: string;

    @Column({
        type: "enum",
        enum: ConfigType
    })
    @IsNotEmpty()
    type: ConfigType;

    @Column({ length: 100 })
    @IsNotEmpty()
    @IsString()
    name: string;

    @Column({ length: 500, nullable: true })
    @IsOptional()
    @IsString()
    description?: string;

    @Column({ type: "jsonb" })
    @IsNotEmpty()
    settings: Record<string, any>;

    @Column({
        type: "enum",
        enum: ConfigStatus,
        default: ConfigStatus.DRAFT
    })
    status: ConfigStatus = ConfigStatus.DRAFT;

    // Version tracking
    @VersionColumn()
    version: number;

    @Column({ type: "jsonb", nullable: true })
    @IsOptional()
    change_history?: Array<{
        version: number;
        timestamp: Date;
        user_id: string;
        changes: Array<{
            path: string;
            old_value: any;
            new_value: any;
        }>;
        notes?: string;
    }>;

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

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: "approved_by" })
    @ValidateNested()
    approved_by_user?: User;

    @Column({ name: "approved_by", nullable: true })
    @IsUUID()
    @IsOptional()
    approved_by?: string;

    // Validation and schema
    @Column({ type: "jsonb", nullable: true })
    @IsOptional()
    validation_schema?: Record<string, any>;

    @Column({ type: "jsonb", nullable: true })
    @IsOptional()
    validation_results?: {
        is_valid: boolean;
        errors?: Array<{
            path: string;
            message: string;
        }>;
        warnings?: Array<{
            path: string;
            message: string;
        }>;
    };

    // Timestamps
    @CreateDateColumn({ name: "created_at" })
    created_at: Date;

    @UpdateDateColumn({ name: "updated_at" })
    updated_at: Date;

    @DeleteDateColumn({ name: "deleted_at" })
    deleted_at?: Date;

    @Column({ name: "activated_at", nullable: true })
    activated_at?: Date;

    @Column({ name: "approved_at", nullable: true })
    approved_at?: Date;

    // Helper methods
    public isActive(): boolean {
        return this.status === ConfigStatus.ACTIVE;
    }

    public needsApproval(): boolean {
        return this.status === ConfigStatus.PENDING_APPROVAL;
    }

    public getConfigValue<T>(path: string, defaultValue?: T): T | undefined {
        const parts = path.split(".");
        let current: any = this.settings;

        for (const part of parts) {
            if (current === undefined || current === null) {
                return defaultValue;
            }
            current = current[part];
        }

        return (current as T) ?? defaultValue;
    }
}
