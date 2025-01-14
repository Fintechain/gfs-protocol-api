/**
 * Types for ISO20022 pain.001.001.09 (Customer Credit Transfer Initiation)
 */

import { Message } from "../../messaging/types/message/index.js";
import { AccountIdentification, AmountInformation, FinancialInstitutionIdentification, PartyIdentification } from "./Party.js";

/**
 * Represents a credit transfer transaction within the ISO 20022 message.
 */
export interface CreditTransferTransaction {
    /** Payment identification information */
    paymentId: {
        /** Instruction identification */
        instructionId: string;
        /** End-to-end identification */
        endToEndId: string;
    };
    /** Payment type information */
    paymentTypeInfo?: {
        /** Service level code */
        serviceLevelCode?: "SEPA" | "SDVA" | "PRPT" | string;
        /** Local instrument code */
        localInstrumentCode?: string;
        /** Category purpose code */
        categoryPurposeCode?: string;
    };
    /** Amount information */
    amount: AmountInformation;
    /** Charge bearer */
    chargeBearer?: "DEBT" | "CRED" | "SHAR" | "SLEV";
    /** Ultimate debtor information */
    ultimateDebtor?: PartyIdentification;
    /** Creditor information */
    creditor: PartyIdentification;
    /** Creditor account */
    creditorAccount: AccountIdentification;
    /** Creditor agent (bank) */
    creditorAgent?: FinancialInstitutionIdentification;
    /** Ultimate creditor information */
    ultimateCreditor?: PartyIdentification;
    /** Purpose code */
    purposeCode?: string;
    /** Remittance information */
    remittanceInfo?: {
        /** Unstructured remittance information */
        unstructured?: string;
        /** Structured remittance information */
        structured?: {
            /** Creditor reference information */
            creditorReferenceInfo?: {
                /** Reference type */
                type: string;
                /** Reference */
                reference: string;
            };
        };
    };
}

/**
 * Represents a complete pain.001.001.09 message structure.
 */
export interface Pain001Message extends Message {
    /** Group header information */
    groupHeader: {
        /** Message identification */
        messageId: string;
        /** Creation date and time */
        creationDateTime: Date;
        /** Number of transactions */
        numberOfTransactions: number;
        /** Control sum */
        controlSum?: string;
        /** Initiating party */
        initiatingParty: PartyIdentification;
    };
    /** Payment information */
    paymentInfo: {
        /** Payment information identification */
        paymentInfoId: string;
        /** Payment method */
        paymentMethod: "TRF" | "CHK";
        /** Requested execution date */
        requestedExecutionDate: Date;
        /** Debtor information */
        debtor: PartyIdentification;
        /** Debtor account */
        debtorAccount: AccountIdentification;
        /** Debtor agent (bank) */
        debtorAgent: FinancialInstitutionIdentification;
        /** Credit transfer transaction information */
        creditTransferTransactionInfo: CreditTransferTransaction[];
    }[];
}
