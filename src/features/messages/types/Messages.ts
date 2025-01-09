import { ethers } from "ethers";

import { MessageStatus, ProtocolSubmissionType } from "../models/Message.js";

export interface ParsedMessage {
    messageType: string;
    submissionType: ProtocolSubmissionType;
    originalXml: string;
    parsedData: any;
    details: MessageDetails;
}

export interface MessageDetails {
    messageId: string;
    creationDate: Date;
    amount: string;
    currency: string;
    debtorAgent: string;
    creditorAgent: string;
    [key: string]: any;
}
export interface SubmitOptions {
    urgent?: boolean;
    maxFee?: string;
    metadata?: Record<string, any>;
}

export interface RetryOptions {
    maxFee?: string;
    urgent?: boolean;
}

export interface SubmitResult {
    messageId: string;
    protocolMessageId: string;
    status: MessageStatus;
}

export interface RetryResult {
    messageId: string;
    newTransactionHash: string;
    status: MessageStatus;
}

export interface MessageStatusResult {
    messageId: string;
    status: MessageStatus;
    protocolStatus: string;
    settlementStatus?: string;
    lastUpdated: Date;
    details: Record<string, any>;
}

export interface ProtocolSubmission {
    messageType: ProtocolSubmissionType;
    payload: any;
    target: ethers.AddressLike;
    targetChain: number;
    metadata: Record<string, any>;
    options: {
        urgent: boolean;
    };
}

export interface MessageTrackingResult {
    messageId: string;
    status: MessageStatus;
    details: {
        protocolMessageId?: string;
        transactionHash?: string;
        blockNumber?: string;
        blockTimestamp?: Date;
        settlementId?: string;
        protocolStatus?: string;
        settlementStatus?: string;
    };
    lastUpdated: Date;
}

export interface MessageHistory {
    messageId: string;
    currentStatus: MessageStatus;
    events: MessageHistoryEvent[];
    processingSteps: Array<{
        step: string;
        timestamp: Date;
        status: string;
        details?: Record<string, any>;
    }>;
    validations: Array<{
        timestamp: Date;
        type: string;
        result: string;
        details: Record<string, any>;
    }>;
    transactions: TransactionEvent[];
}

export interface MessageHistoryEvent {
    type: string;
    timestamp: Date;
    details?: Record<string, any>;
}

export interface TransactionEvent {
    type: string;
    transactionHash: string;
    blockNumber?: string;
    timestamp?: Date;
}

export interface CancelResult {
    messageId: string;
    status: MessageStatus;
    cancelledAt: Date;
}
// Validation types that align with existing error structure
export interface ValidationResultItem {
    type: string; // e.g. "schema", "business_rules", "protocol", "settlement"
    isValid: boolean;
    validationErrors?: Array<{
        field: string;
        message: string;
    }>;
    details?: Record<string, any>;
}

// Overall validation results
export interface ValidationResults {
    isValid: boolean;
    validations: ValidationResultItem[];
    timestamp: Date;
}

// Rule evaluation - keeping this as is since it's used internally
export interface RuleResult {
    valid: boolean;
    code: string;
    message: string;
}
