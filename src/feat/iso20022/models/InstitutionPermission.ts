// src/institutions/models/InstitutionPermission.ts

import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, ValidateNested } from "class-validator";
import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";

import { User } from "../../auth/models/User.js";
import { Institution } from "./Institution.js";

/**
 * Permission Level Enum
 * Defines the level of access granted by the permission
 */
export enum PermissionLevel {
    FULL = "full",
    WRITE = "write",
    READ = "read",
    NONE = "none"
}

/**
 * Permission Type Enum
 * Defines the type of permission granted
 */
export enum PermissionType {
    MESSAGE_TYPE = "message_type",
    FEATURE = "feature",
    API = "api",
    NETWORK = "network",
    CUSTOM = "custom"
}

/**
 * Institution Permission Entity
 *
 * Represents granular permissions for institutions, controlling access
 * to specific features, message types, or APIs.
 *
 * @remarks
 * - Supports hierarchical permission inheritance
 * - Allows for time-bound permissions
 * - Maintains audit trail of permission changes
 */
@Entity("institution_permissions")
@Index(["institution_id", "permission_type", "permission_key"])
export class InstitutionPermission {
    @PrimaryGeneratedColumn("uuid")
    @IsUUID()
    @IsOptional()
    id: string;

    @Column({
        type: "enum",
        enum: PermissionType
    })
    @IsEnum(PermissionType)
    permission_type: PermissionType;

    @Column({ length: 100 })
    @IsNotEmpty()
    @IsString()
    permission_key: string;

    @Column({
        type: "enum",
        enum: PermissionLevel,
        default: PermissionLevel.NONE
    })
    @IsEnum(PermissionLevel)
    level: PermissionLevel = PermissionLevel.NONE;

    @Column({ type: "jsonb", nullable: true })
    @IsOptional()
    constraints?: {
        time_restrictions?: {
            start_time?: string;
            end_time?: string;
            timezone?: string;
            days_of_week?: number[];
        };
        volume_limits?: {
            daily_limit?: number;
            monthly_limit?: number;
            transaction_limit?: number;
        };
        network_restrictions?: string[];
        ip_restrictions?: string[];
        value_limits?: {
            min_amount?: number;
            max_amount?: number;
            currency?: string;
        };
    };

    // Validity period
    @Column({ name: "valid_from", type: "timestamp", nullable: true })
    @IsOptional()
    valid_from?: Date;

    @Column({ name: "valid_until", type: "timestamp", nullable: true })
    @IsOptional()
    valid_until?: Date;

    // Relationships
    @ManyToOne(() => Institution, { nullable: false })
    @JoinColumn({ name: "institution_id" })
    @ValidateNested()
    institution: Institution;

    @Column({ name: "institution_id" })
    @IsUUID()
    institution_id: string;

    @ManyToOne(() => User, { nullable: false })
    @JoinColumn({ name: "granted_by" })
    @ValidateNested()
    granted_by_user: User;

    @Column({ name: "granted_by" })
    @IsUUID()
    granted_by: string;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: "revoked_by" })
    @ValidateNested()
    revoked_by_user?: User;

    @Column({ name: "revoked_by", nullable: true })
    @IsUUID()
    @IsOptional()
    revoked_by?: string;

    // Audit trail
    @Column({ type: "jsonb", nullable: true })
    @IsOptional()
    change_history?: Array<{
        timestamp: Date;
        user_id: string;
        action: "grant" | "modify" | "revoke";
        old_level?: PermissionLevel;
        new_level?: PermissionLevel;
        reason?: string;
    }>;

    // Timestamps
    @CreateDateColumn({ name: "created_at" })
    created_at: Date;

    @UpdateDateColumn({ name: "updated_at" })
    updated_at: Date;

    @DeleteDateColumn({ name: "deleted_at" })
    deleted_at?: Date;

    @Column({ name: "revoked_at", nullable: true })
    revoked_at?: Date;

    // Helper methods
    public isActive(): boolean {
        const now = new Date();
        return !this.revoked_at && (!this.valid_from || this.valid_from <= now) && (!this.valid_until || this.valid_until >= now);
    }

    public canAccess(level: PermissionLevel): boolean {
        const levels = {
            [PermissionLevel.NONE]: 0,
            [PermissionLevel.READ]: 1,
            [PermissionLevel.WRITE]: 2,
            [PermissionLevel.FULL]: 3
        };
        return levels[this.level] >= levels[level];
    }

    public isWithinTimeRestrictions(): boolean {
        if (!this.constraints?.time_restrictions) {
            return true;
        }

        const now = new Date();
        const restrictions = this.constraints.time_restrictions;

        // Check day of week
        if (restrictions.days_of_week?.length && !restrictions.days_of_week.includes(now.getDay())) {
            return false;
        }

        // Check time of day
        if (restrictions.start_time && restrictions.end_time) {
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();
            const currentSeconds = now.getSeconds();
            const currentTimeValue = `${currentHour.toString().padStart(2, "0")}:${currentMinute.toString().padStart(2, "0")}:${currentSeconds.toString().padStart(2, "0")}`;
            return currentTimeValue >= restrictions.start_time && currentTimeValue <= restrictions.end_time;
        }
        return true;
    }

    public isWithinVolumeLimits(currentVolume: number): boolean {
        const limits = this.constraints?.volume_limits;
        if (!limits) {
            return true;
        }

        return (
            (!limits.daily_limit || currentVolume <= limits.daily_limit) &&
            (!limits.monthly_limit || currentVolume <= limits.monthly_limit) &&
            (!limits.transaction_limit || currentVolume <= limits.transaction_limit)
        );
    }
}
