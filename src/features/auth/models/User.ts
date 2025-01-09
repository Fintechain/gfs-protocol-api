// src/auth/models/User.ts

import { IsEmail, IsNotEmpty, IsOptional, IsString, IsUUID, MinLength } from "class-validator";
import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    Index,
    JoinTable,
    ManyToMany,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";

import { Institution } from "../../institutions/models/Institution.js";
import { Role } from "./Role.js";

/**
 * User Entity
 *
 * Represents a user in the system with authentication and authorization details.
 * Users are associated with institutions and have specific roles.
 *
 * @remarks
 * - Supports multi-institution users
 * - Role-based access control
 * - Audit trail tracking
 */
@Entity("users")
@Index(["email"], { unique: true })
export class User {
    @PrimaryGeneratedColumn("uuid")
    @IsUUID()
    @IsOptional()
    id: string;

    @Column({ length: 255 })
    @IsNotEmpty()
    @IsString()
    first_name: string;

    @Column({ length: 255 })
    @IsNotEmpty()
    @IsString()
    last_name: string;

    @Column({ length: 255, unique: true })
    @IsEmail()
    @IsNotEmpty()
    @Index()
    email: string;

    @Column({ select: false }) // Password hash not included in default selects
    @MinLength(8)
    password_hash: string;

    @Column({ type: "boolean" })
    is_active: boolean = false;

    @Column({ type: "boolean" })
    email_verified: boolean = false;

    @Column({ nullable: true })
    @IsOptional()
    last_login_at?: Date;

    @Column({ type: "jsonb", nullable: true })
    @IsOptional()
    preferences?: {
        timezone?: string;
        language?: string;
        notifications?: {
            email?: boolean;
            web?: boolean;
        };
        theme?: string;
    };

    // Relationships
    @ManyToOne(() => Institution, { nullable: false })
    @JoinTable()
    primary_institution: Institution;

    @Column({ name: "primary_institution_id" })
    @IsUUID()
    primary_institution_id: string;

    @ManyToMany(() => Institution)
    @JoinTable({
        name: "user_institutions",
        joinColumn: { name: "user_id", referencedColumnName: "id" },
        inverseJoinColumn: { name: "institution_id", referencedColumnName: "id" }
    })
    institutions: Institution[];

    @ManyToMany(() => Role)
    @JoinTable({
        name: "user_roles",
        joinColumn: { name: "user_id", referencedColumnName: "id" },
        inverseJoinColumn: { name: "role_id", referencedColumnName: "id" }
    })
    roles: Role[];

    // Timestamps
    @CreateDateColumn({ name: "created_at" })
    created_at: Date;

    @UpdateDateColumn({ name: "updated_at" })
    updated_at: Date;

    @DeleteDateColumn({ name: "deleted_at" })
    deleted_at?: Date;

    // Helper methods
    public getFullName(): string {
        return `${this.first_name} ${this.last_name}`;
    }

    public hasRole(roleName: string): boolean {
        return this.roles?.some((role) => role.name === roleName) || false;
    }
}
