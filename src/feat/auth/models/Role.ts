// src/auth/models/Role.ts

import { IsArray, IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";
import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    Index,
    JoinTable,
    ManyToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";

import { Permission } from "./Permission.js";

/**
 * Role Scope Enum
 * Defines the scope of role application
 */
export enum RoleScope {
    GLOBAL = "global",
    INSTITUTION = "institution",
    TEAM = "team"
}

/**
 * Role Entity
 *
 * Represents a role in the system that can be assigned to users.
 * Roles are collections of permissions that define what actions users can perform.
 *
 * @remarks
 * - Supports hierarchical permissions
 * - Allows for role inheritance
 * - Scoped to different levels (global, institution, team)
 */
@Entity("roles")
@Index(["name", "scope"], { unique: true })
export class Role {
    @PrimaryGeneratedColumn("uuid")
    @IsUUID()
    @IsOptional()
    id: string;

    @Column({ length: 100 })
    @IsNotEmpty()
    @IsString()
    @Index()
    name: string;

    @Column({ length: 255, nullable: true })
    @IsOptional()
    @IsString()
    description?: string;

    @Column({
        type: "enum",
        enum: RoleScope,
        default: RoleScope.INSTITUTION
    })
    scope: RoleScope = RoleScope.INSTITUTION;

    @Column({ type: "boolean", default: false })
    is_system_role: boolean = false;

    @Column({ type: "jsonb", nullable: true })
    @IsOptional()
    metadata?: {
        display_name?: string;
        category?: string;
        priority?: number;
        custom_attributes?: Record<string, any>;
    };

    // Role hierarchy support
    @Column({ type: "uuid", array: true, default: [] })
    @IsArray()
    @IsUUID("4", { each: true })
    inherits_from: string[];

    // Permissions relationship
    @ManyToMany(() => Permission)
    @JoinTable({
        name: "role_permissions",
        joinColumn: { name: "role_id", referencedColumnName: "id" },
        inverseJoinColumn: { name: "permission_id", referencedColumnName: "id" }
    })
    permissions: Permission[];

    // Direct permission codes for quick access
    @Column({ type: "text", array: true, default: [] })
    @IsArray()
    permission_codes: string[] = [];

    // Timestamps
    @CreateDateColumn({ name: "created_at" })
    created_at: Date;

    @UpdateDateColumn({ name: "updated_at" })
    updated_at: Date;

    @DeleteDateColumn({ name: "deleted_at" })
    deleted_at?: Date;

    // Helper methods
    public hasPermission(permissionCode: string): boolean {
        return this.permission_codes.includes(permissionCode);
    }

    public isGlobal(): boolean {
        return this.scope === RoleScope.GLOBAL;
    }

    public isInstitutionScoped(): boolean {
        return this.scope === RoleScope.INSTITUTION;
    }

    public isTeamScoped(): boolean {
        return this.scope === RoleScope.TEAM;
    }
}
