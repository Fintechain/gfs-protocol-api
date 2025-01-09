// src/auth/models/Permission.ts

import { IsNotEmpty, IsOptional, IsString, IsUUID, ValidateNested } from "class-validator";
import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, Tree, TreeChildren, TreeParent, UpdateDateColumn } from "typeorm";

/**
 * Permission Resource Type Enum
 * Defines the type of resource the permission applies to
 */
export enum ResourceType {
    MESSAGE = "message",
    INSTITUTION = "institution",
    USER = "user",
    ROLE = "role",
    SYSTEM = "system",
    REPORT = "report",
    AUDIT = "audit"
}

/**
 * Permission Action Enum
 * Defines the allowed actions on resources
 */
export enum PermissionAction {
    CREATE = "create",
    READ = "read",
    UPDATE = "update",
    DELETE = "delete",
    APPROVE = "approve",
    EXECUTE = "execute",
    MANAGE = "manage"
}

/**
 * Permission Entity
 *
 * Represents a granular permission in the system.
 * Permissions are organized in a hierarchical structure and
 * can be assigned to roles.
 *
 * @remarks
 * - Uses tree structure for permission hierarchy
 * - Supports wildcard permissions
 * - Includes condition-based permissions
 */
@Entity("permissions")
@Tree("materialized-path")
@Index(["code"], { unique: true })
export class Permission {
    @PrimaryGeneratedColumn("uuid")
    @IsUUID()
    @IsOptional()
    id: string;

    @Column({ length: 100, unique: true })
    @IsNotEmpty()
    @IsString()
    @Index()
    code: string;

    @Column({ length: 255 })
    @IsNotEmpty()
    @IsString()
    name: string;

    @Column({ length: 500, nullable: true })
    @IsOptional()
    @IsString()
    description?: string;

    @Column({
        type: "enum",
        enum: ResourceType
    })
    @IsNotEmpty()
    resource_type: ResourceType;

    @Column({
        type: "enum",
        enum: PermissionAction
    })
    @IsNotEmpty()
    action: PermissionAction;

    @Column({ type: "jsonb", nullable: true })
    @IsOptional()
    conditions?: {
        attributes?: string[];
        constraints?: Record<string, any>;
        dependencies?: string[];
    };

    // Tree structure
    @TreeParent()
    @ValidateNested()
    parent?: Permission;

    @Column({ name: "parent_id", nullable: true })
    @IsUUID()
    @IsOptional()
    parent_id?: string;

    @TreeChildren()
    children: Permission[];

    // Metadata
    @Column({ type: "jsonb", nullable: true })
    @IsOptional()
    metadata?: {
        ui_category?: string;
        risk_level?: string;
        requires_2fa?: boolean;
        audit_trail?: boolean;
    };

    // Timestamps
    @CreateDateColumn({ name: "created_at" })
    created_at: Date;

    @UpdateDateColumn({ name: "updated_at" })
    updated_at: Date;

    // Helper methods
    public getFullPermissionPath(): string {
        return this.parent ? `${this.parent.getFullPermissionPath()}:${this.code}` : this.code;
    }

    public matches(permissionCode: string): boolean {
        const fullPath = this.getFullPermissionPath();
        return (
            permissionCode === fullPath ||
            permissionCode === "*" ||
            (permissionCode.endsWith("*") && fullPath.startsWith(permissionCode.slice(0, -1)))
        );
    }

    public requiresTwoFactor(): boolean {
        return this.metadata?.requires_2fa ?? false;
    }

    public requiresAudit(): boolean {
        return this.metadata?.audit_trail ?? false;
    }
}
