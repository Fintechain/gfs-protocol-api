// src/services/PACS008PayloadService.ts

import { Service } from "@tsed/di";
import { ethers } from "ethers";
import { IProtocolCoordinator } from "src/features/typechain/index.js";

import { MESSAGE_TYPE_PACS008, PACS008_REQUIRED_FIELDS } from "../types/Pacs008.js";

@Service()
export class PACS008PayloadService {
    /**
     * Generates a PACS.008 message payload in the required format
     * @param debtorAgent Address of the sending institution
     * @param creditorAgent Address of the receiving institution
     * @param token Address of the token being transferred
     * @param amount Amount to transfer in base units
     * @returns Encoded payload string
     * @throws Error if any address is invalid or amount is negative
     */
    public generatePayload(debtorAgent: string, creditorAgent: string, token: string, amount: bigint): string {
        // Validate inputs
        this.validateAddress(debtorAgent, "debtorAgent");
        this.validateAddress(creditorAgent, "creditorAgent");
        this.validateAddress(token, "token");
        this.validateAmount(amount);

        const instructionId = ethers.randomBytes(32);

        return ethers.concat([
            // Debtor agent
            PACS008_REQUIRED_FIELDS[0],
            ethers.zeroPadValue(debtorAgent, 32),

            // Creditor agent
            PACS008_REQUIRED_FIELDS[1],
            ethers.zeroPadValue(creditorAgent, 32),

            // Token
            PACS008_REQUIRED_FIELDS[2],
            ethers.zeroPadValue(token, 32),

            // Amount
            PACS008_REQUIRED_FIELDS[3],
            ethers.zeroPadValue(ethers.toBeHex(amount), 32),

            // Instruction ID
            PACS008_REQUIRED_FIELDS[4],
            ethers.hexlify(instructionId)
        ]);
    }

    /**
     * Creates a full message submission object
     * @param debtorAgent Address of the sending institution
     * @param creditorAgent Address of the receiving institution
     * @param token Address of the token being transferred
     * @param amount Amount to transfer
     * @param target Target handler address
     * @param targetChain Target chain ID
     * @returns Message submission object ready for protocol coordinator
     */
    public createSubmission(
        debtorAgent: string,
        creditorAgent: string,
        token: string,
        amount: bigint,
        target: string,
        targetChain: number
    ): IProtocolCoordinator.MessageSubmissionStruct {
        return {
            messageType: MESSAGE_TYPE_PACS008,
            target,
            targetChain,
            payload: this.generatePayload(debtorAgent, creditorAgent, token, amount)
        };
    }

    /**
     * Validates an Ethereum address
     * @param address Address to validate
     * @param fieldName Name of the field for error message
     * @throws Error if address is invalid
     */
    private validateAddress(address: string, fieldName: string): void {
        if (!ethers.isAddress(address)) {
            throw new Error(`Invalid ${fieldName} address: ${address}`);
        }
    }

    /**
     * Validates a token amount
     * @param amount Amount to validate
     * @throws Error if amount is negative
     */
    private validateAmount(amount: bigint): void {
        if (amount < BigInt(0)) {
            throw new Error(`Invalid amount: ${amount}. Amount must be positive`);
        }
    }

    /**
     * Decodes a PACS.008 payload into its components
     * @param payload Encoded payload string
     * @returns Decoded PACS.008 message fields
     * @throws Error if payload format is invalid
     */
    public decodePayload(payload: string): {
        debtorAgent: string;
        creditorAgent: string;
        token: string;
        amount: bigint;
        instructionId: string;
    } {
        // Each field consists of a 4-byte selector and 32-byte value
        const FIELD_LENGTH = 36;
        const VALUE_LENGTH = 32;

        try {
            const bytes = ethers.getBytes(payload);

            // Verify payload length
            if (bytes.length !== FIELD_LENGTH * 5) {
                throw new Error("Invalid payload length");
            }

            // Helper to extract value for a field
            const extractValue = (offset: number) => ethers.hexlify(bytes.slice(offset + 4, offset + FIELD_LENGTH));

            return {
                debtorAgent: ethers.getAddress(extractValue(0)),
                creditorAgent: ethers.getAddress(extractValue(FIELD_LENGTH)),
                token: ethers.getAddress(extractValue(FIELD_LENGTH * 2)),
                amount: BigInt(extractValue(FIELD_LENGTH * 3)),
                instructionId: extractValue(FIELD_LENGTH * 4)
            };
        } catch (error) {
            throw new Error(`Failed to decode PACS.008 payload: ${error.message}`);
        }
    }
}
