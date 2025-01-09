//src/institutions/models/__tests__/Institution.spec.ts

import { PlatformTest } from "@tsed/platform-http/testing";
import { validate } from "class-validator";
import { beforeEach, describe, expect, it } from "vitest";

import { Institution, InstitutionStatus, InstitutionType } from "../Institution.js";

describe("Institution Entity", () => {
    beforeEach(PlatformTest.create);

    describe("Validation", () => {
        it("should validate a valid institution", async () => {
            const institution = new Institution();
            institution.name = "Test Bank";
            institution.code = "TEST_BANK_001";
            institution.type = InstitutionType.BANK;
            institution.status = InstitutionStatus.ACTIVE;

            const errors = await validate(institution);
            expect(errors).toHaveLength(0);
        });

        it("should fail validation for missing required fields", async () => {
            const institution = new Institution();
            const errors = await validate(institution);

            const requiredFields = ["name", "code"];
            const actualFields = errors.map((e) => e.property).filter((p) => requiredFields.includes(p));

            expect(actualFields.sort()).toEqual(requiredFields.sort());
        });

        it("should validate optional metadata", async () => {
            const institution = new Institution();
            institution.name = "Test Bank";
            institution.code = "TEST_BANK_001";
            institution.metadata = {
                address: {
                    street: "123 Main St",
                    city: "New York",
                    country: "USA"
                },
                contact: {
                    email: "test@bank.com"
                }
            };

            const errors = await validate(institution);
            expect(errors).toHaveLength(0);
        });
    });

    describe("Status Management", () => {
        it("should initialize with PENDING_APPROVAL status", () => {
            const institution = new Institution();
            expect(institution.status).toBe(InstitutionStatus.PENDING_APPROVAL);
        });

        it("should handle status changes", () => {
            const institution = new Institution();

            institution.status = InstitutionStatus.ACTIVE;
            expect(institution.isActive()).toBe(true);

            institution.status = InstitutionStatus.SUSPENDED;
            expect(institution.isActive()).toBe(false);
        });
    });

    describe("Type Management", () => {
        it("should initialize with OTHER type", () => {
            const institution = new Institution();
            expect(institution.type).toBe(InstitutionType.OTHER);
        });

        it("should handle all institution types", () => {
            const institution = new Institution();
            Object.values(InstitutionType).forEach((type) => {
                institution.type = type;
                expect(institution.type).toBe(type);
            });
        });
    });

    describe("Hierarchy Management", () => {
        it("should handle parent-child relationships", () => {
            const parent = new Institution();
            parent.name = "Parent Bank";
            parent.code = "PARENT_001";

            const child = new Institution();
            child.name = "Child Branch";
            child.code = "CHILD_001";
            child.parent = parent;

            expect(child.parent).toBe(parent);
        });

        it("should generate correct hierarchy path", () => {
            const parent = new Institution();
            parent.name = "Parent Bank";

            const child = new Institution();
            child.name = "Child Branch";
            child.parent = parent;

            expect(child.getFullHierarchyPath()).toBe("Parent Bank > Child Branch");
            expect(parent.getFullHierarchyPath()).toBe("Parent Bank");
        });
    });

    describe("Operational Settings", () => {
        it("should handle message type support", () => {
            const institution = new Institution();
            institution.operational_settings = {
                message_types: ["pacs.008", "pacs.009"]
            };

            expect(institution.supportsMessageType("pacs.008")).toBe(true);
            expect(institution.supportsMessageType("pacs.004")).toBe(false);
        });

        it("should handle missing operational settings", () => {
            const institution = new Institution();
            expect(institution.supportsMessageType("pacs.008")).toBe(false);
        });
    });

    describe("Compliance Status", () => {
        it("should track compliance information", () => {
            const institution = new Institution();
            const now = new Date();

            institution.compliance_status = {
                kyc_verified: true,
                aml_status: "approved",
                last_review_date: now,
                risk_rating: "low"
            };

            expect(institution.compliance_status.kyc_verified).toBe(true);
            expect(institution.compliance_status.last_review_date).toBe(now);
        });
    });
});
