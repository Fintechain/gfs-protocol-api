/**
 * Represents a financial institution identification within the ISO 20022 message.
 */
export interface FinancialInstitutionIdentification {
    /** Bank Identifier Code (BIC) */
    bic?: string;
    /** Clearing system member identification */
    clearingSystemMemberId?: {
        /** Identification of the clearing system */
        clearingSystemId: string;
        /** Member identification within the clearing system */
        memberId: string;
    };
    /** Name of the financial institution */
    name?: string;
    /** Postal address of the financial institution */
    postalAddress?: PostalAddress;
}

/**
 * Represents a postal address structure within the ISO 20022 message.
 */
export interface PostalAddress {
    /** Address type (e.g., residential, business) */
    addressType?: "ADDR" | "PBOX" | "HOME" | "BIZZ" | "MLTO" | "DLVY";
    /** Department name */
    department?: string;
    /** Sub-department name */
    subDepartment?: string;
    /** Street name */
    streetName?: string;
    /** Building number */
    buildingNumber?: string;
    /** Postal code */
    postCode?: string;
    /** Town name */
    townName: string;
    /** Country sub-division (state, province, etc.) */
    countrySubDivision?: string;
    /** Country code (ISO 3166 alpha-2) */
    country: string;
    /** Additional address lines */
    addressLines?: string[];
}

/**
 * Represents an account identification within the ISO 20022 message.
 */
export interface AccountIdentification {
    /** International Bank Account Number */
    iban?: string;
    /** Other account identification */
    other?: {
        /** Account identification */
        identification: string;
        /** Name of the identification scheme */
        schemeName?: string;
        /** Issuer of the identification */
        issuer?: string;
    };
}

/**
 * Represents amount information within the ISO 20022 message.
 */
export interface AmountInformation {
    /** Amount value as a string to preserve precision */
    value: string;
    /** Currency code (ISO 4217) */
    currency: string;
}

/**
 * Represents party identification within the ISO 20022 message.
 */
export interface PartyIdentification {
    /** Name of the party */
    name: string;
    /** Postal address of the party */
    postalAddress?: PostalAddress;
    /** Organization identification */
    organisationId?: {
        /** BIC code */
        bic?: string;
        /** Other organization identification */
        other?: {
            /** Identification */
            identification: string;
            /** Scheme name */
            schemeName?: string;
            /** Issuer */
            issuer?: string;
        };
    };
    /** Private identification */
    privateId?: {
        /** Date and place of birth */
        dateAndPlaceOfBirth?: {
            /** Birth date */
            birthDate: Date;
            /** Province of birth */
            provinceOfBirth?: string;
            /** City of birth */
            cityOfBirth: string;
            /** Country of birth */
            countryOfBirth: string;
        };
        /** Other private identification */
        other?: {
            /** Identification */
            identification: string;
            /** Scheme name */
            schemeName?: string;
            /** Issuer */
            issuer?: string;
        };
    };
}
