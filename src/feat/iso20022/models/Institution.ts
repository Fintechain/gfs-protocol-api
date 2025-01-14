// src/institutions/models/Institution.ts

import { IsNotEmpty, IsOptional, IsString, IsUUID, ValidateNested } from "class-validator";
import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    Index,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    Tree,
    TreeChildren,
    TreeParent,
    UpdateDateColumn
} from "typeorm";

import { InstitutionConfig } from "./InstitutionConfig.js";
import { InstitutionPermission } from "./InstitutionPermission.js";

/**
 * Institution Status Enum
 * Represents the current operational status of an institution
 */
export enum InstitutionStatus {
    ACTIVE = "active",
    INACTIVE = "inactive",
    SUSPENDED = "suspended",
    PENDING_APPROVAL = "pending_approval"
}

/**
 * Institution Type Enum
 * Defines the type of financial institution
 */
export enum InstitutionType {
    BANK = "bank",
    CREDIT_UNION = "credit_union",
    PAYMENT_PROVIDER = "payment_provider",
    FINTECH = "fintech",
    CENTRAL_BANK = "central_bank",
    OTHER = "other"
}

/**
 * Institution Entity
 *
 * Represents a financial institution in the system.
 * Supports hierarchical relationships between institutions
 * and maintains configuration and permission settings.
 *
 * @remarks
 * - Uses tree structure for institution hierarchy
 * - Supports multiple configuration profiles
 * - Tracks compliance and operational status
 */
@Entity("institutions")
@Tree("materialized-path")
@Index(["code"], { unique: true })
export class Institution {
    @PrimaryGeneratedColumn("uuid")
    @IsUUID()
    @IsOptional()
    id: string;

    @Column({ length: 255 })
    @IsNotEmpty()
    @IsString()
    name: string;

    @Column({ length: 50, unique: true })
    @IsNotEmpty()
    @IsString()
    @Index()
    code: string;

    @Column({
        type: "enum",
        enum: InstitutionType,
        default: InstitutionType.OTHER
    })
    type: InstitutionType = InstitutionType.OTHER;

    @Column({
        type: "enum",
        enum: InstitutionStatus,
        default: InstitutionStatus.PENDING_APPROVAL
    })
    status: InstitutionStatus = InstitutionStatus.PENDING_APPROVAL;

    @Column({ type: "jsonb", nullable: true })
    @IsOptional()
    metadata?: {
        address?: {
            street?: string;
            city?: string;
            country?: string;
            postal_code?: string;
        };
        contact?: {
            phone?: string;
            email?: string;
            website?: string;
        };
        registration?: {
            legal_name?: string;
            registration_number?: string;
            tax_id?: string;
        };
    };

    // Tree structure
    @TreeParent()
    @ValidateNested()
    parent?: Institution;

    @Column({ name: "parent_id", nullable: true })
    @IsUUID()
    @IsOptional()
    parent_id?: string;

    @TreeChildren()
    children: Institution[];

    // Relationships
    @OneToMany(() => InstitutionConfig, (config) => config.institution)
    configurations: InstitutionConfig[];

    @OneToMany(() => InstitutionPermission, (permission) => permission.institution)
    permissions: InstitutionPermission[];

    // Security and compliance
    @Column({ name: "api_key_hash", nullable: true, select: false })
    api_key_hash?: string;

    @Column({ type: "jsonb", nullable: true })
    @IsOptional()
    compliance_status?: {
        kyc_verified?: boolean;
        aml_status?: string;
        last_review_date?: Date;
        risk_rating?: string;
        compliance_notes?: string[];
    };

    // Operational settings
    @Column({ type: "jsonb", nullable: true })
    @IsOptional()
    operational_settings?: {
        timezone?: string;
        operating_hours?: {
            start?: string;
            end?: string;
            timezone?: string;
        };
        message_types?: string[];
        supported_networks?: string[];
        rate_limits?: Record<string, number>;
    };

    // Timestamps
    @CreateDateColumn({ name: "created_at" })
    created_at: Date;

    @UpdateDateColumn({ name: "updated_at" })
    updated_at: Date;

    @DeleteDateColumn({ name: "deleted_at" })
    deleted_at?: Date;

    // Helper methods
    public isActive(): boolean {
        return this.status === InstitutionStatus.ACTIVE;
    }

    public getFullHierarchyPath(): string {
        return this.parent ? `${this.parent.getFullHierarchyPath()} > ${this.name}` : this.name;
    }

    public supportsMessageType(messageType: string): boolean {
        return this.operational_settings?.message_types?.includes(messageType) || false;
    }
}
