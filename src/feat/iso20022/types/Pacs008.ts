/**
 * File: /src/features/messaging/types/pacs008.types.ts
 * Contains type definitions for PACS.008.001.08 (FIToFI Customer Credit Transfer) message format
 */

import { Message } from "../../messaging/types/message/index.js";
import { AccountIdentification, AmountInformation, FinancialInstitutionIdentification, PartyIdentification } from "./Party.js";

/**
 * Represents settlement information within the PACS.008 message
 */
export interface SettlementInformation {
    /** Method used to settle the credit transfer instructions */
    settlementMethod: "INDA" | "INGA" | "COVE" | "CLRG";
    /** Account used to process the settlement */
    settlementAccount?: AccountIdentification;
    /** Information about the clearing system */
    clearingSystem?: {
        /** Identification of the clearing system */
        clearingSystemId: string;
        /** Proprietary identification of the clearing system */
        proprietaryCode?: string;
    };
    /** Institution responsible for settlement */
    settlementInstitution?: FinancialInstitutionIdentification;
}

/**
 * Represents charge information within the PACS.008 message
 */
export interface ChargeInformation {
    /** Amount of the charge */
    amount: AmountInformation;
    /** Party that charges the fee */
    chargeBearer: "DEBT" | "CRED" | "SHAR" | "SLEV";
    /** Party charging the fee */
    chargerParty?: FinancialInstitutionIdentification;
}

/**
 * Represents a credit transfer transaction within the PACS.008 message
 */
export interface Pacs008TransactionInformation {
    /** Payment identification information */
    paymentId: {
        /** Instruction identification assigned by the instructing agent */
        instructionId: string;
        /** End-to-end identification assigned by the originating party */
        endToEndId: string;
        /** Transaction identification assigned by the first instructing agent */
        transactionId: string;
        /** UETR (Unique End-to-end Transaction Reference) */
        uetr: string;
        /** Clearing system reference assigned by the clearing system */
        clearingSystemReference?: string;
    };
    /** Settlement information */
    settlementInfo: SettlementInformation;
    /** Total amount to be moved between the debtor and creditor */
    interbankSettlementAmount: AmountInformation;
    /** Date when the amount is to be moved between the debtor and creditor */
    interbankSettlementDate: Date;
    /** Charges information */
    chargeInformation?: ChargeInformation[];
    /** Previous instructing agents in the payment chain */
    previousInstructingAgents?: FinancialInstitutionIdentification[];
    /** Institution where the debtor holds their account */
    debtorAgent: FinancialInstitutionIdentification;
    /** Party that owes money to the creditor */
    debtor: PartyIdentification;
    /** Account of the debtor */
    debtorAccount: AccountIdentification;
    /** Original ordering party of the payment */
    initiatingParty?: PartyIdentification;
    /** Institution where the creditor holds their account */
    creditorAgent: FinancialInstitutionIdentification;
    /** Party that receives the payment */
    creditor: PartyIdentification;
    /** Account of the creditor */
    creditorAccount: AccountIdentification;
    /** Ultimate recipient of the payment */
    ultimateCreditor?: PartyIdentification;
    /** Purpose of the payment */
    purpose?: {
        /** Payment purpose code */
        code?: string;
        /** Proprietary purpose definition */
        proprietary?: string;
    };
    /** Remittance information */
    remittanceInformation?: {
        /** Unstructured remittance information */
        unstructured?: string[];
        /** Structured remittance information */
        structured?: {
            /** Reference information */
            referenceInfo?: {
                /** Type of the reference */
                type: string;
                /** Reference value */
                reference: string;
            };
            /** Additional remittance information */
            additionalInfo?: string[];
        };
    };
}

/**
 * Represents a complete PACS.008 message structure
 */
export interface Pacs008Message extends Message {
    /** Group header of the message */
    groupHeader: {
        /** Unique message identification */
        messageId: string;
        /** Date and time when the message was created */
        creationDateTime: Date;
        /** Number of individual transactions contained in the message */
        numberOfTransactions: number;
        /** Total of all individual amounts included in the message */
        totalInterbankSettlementAmount?: AmountInformation;
        /** Date on which the settlement is to take place */
        interbankSettlementDate: Date;
        /** Agreement under which the message is exchanged */
        settlementInformation: SettlementInformation;
        /** Institution that receives the instruction */
        instructingAgent: FinancialInstitutionIdentification;
        /** Institution that executes the instruction */
        instructedAgent: FinancialInstitutionIdentification;
    };
    /** Collection of credit transfer transactions */
    creditTransferTransactionInfo: Pacs008TransactionInformation[];
}
