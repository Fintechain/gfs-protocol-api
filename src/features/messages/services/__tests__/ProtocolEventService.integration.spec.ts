import { ethers } from "ethers";
import { describe, expect, it } from "vitest";

import { type Env, loadEnv } from "../../../../config/envs/index.js";

// Contract interface - only what we need for the test
const PROTOCOL_COORDINATOR_ABI = [
    "event MessageSubmissionInitiated(bytes32 indexed messageId, address indexed sender, bytes32 indexed messageType, address target, uint16 targetChain)",
    "function submitMessage((bytes32 messageType, address target, uint16 targetChain, bytes payload)) external payable returns (bytes32)",
    "function quoteMessageFee((bytes32 messageType, address target, uint16 targetChain, bytes payload)) external view returns (uint256, uint256)"
];

describe("Message Submission Integration Test", () => {
    // Helper to create a basic PACS008 payload
    function createTestPayload(sender: string, receiver: string) {
        return ethers.concat([
            ethers.id("debtorAgent").slice(0, 10),
            ethers.zeroPadValue(sender, 32),
            ethers.id("creditorAgent").slice(0, 10),
            ethers.zeroPadValue(receiver, 32)
        ]);
    }

    it("should submit a message and emit event", async () => {
        // Load environment
        const env = loadEnv();

        // Validate required environment variables
        if (!env.RPC_URL) throw new Error("RPC_URL environment variable not set");
        if (!env.COORDINATOR_CONTRACT_ADDRESS) throw new Error("COORDINATOR_CONTRACT_ADDRESS environment variable not set");
        if (!env.PRIVATE_KEY) throw new Error("PRIVATE_KEY environment variable not set");
        if (!env.TOKEN_CONTRACT_ADDRESS) throw new Error("TOKEN_CONTRACT_ADDRESS environment variable not set");
        if (!env.MESSAGE_HANDLER_ADDRESS) throw new Error("MESSAGE_HANDLER_ADDRESS environment variable not set");

        console.log("Setting up provider and contract...");
        const provider = new ethers.JsonRpcProvider(env.RPC_URL);
        const signer = new ethers.Wallet(env.PRIVATE_KEY, provider);
        const contract = new ethers.Contract(env.COORDINATOR_CONTRACT_ADDRESS, PROTOCOL_COORDINATOR_ABI, signer);

        // Create test message
        console.log("Creating test message...");
        const messageType = ethers.id("pacs.008");
        const submission = {
            messageType,
            target: env.MESSAGE_HANDLER_ADDRESS,
            targetChain: 1, // Local chain ID
            payload: createTestPayload(await signer.getAddress(), "0x9aBD1C4028b414d07Bf3d110A53EE8E34E4817d7")
        };

        try {
            // Get fees
            console.log("Getting fee estimation...");
            const [baseFee, deliveryFee] = await contract.quoteMessageFee(submission);
            console.log("Fees:", {
                baseFee: ethers.formatEther(baseFee),
                deliveryFee: ethers.formatEther(deliveryFee)
            });

            // Submit message
            console.log("Submitting message...");
            const tx = await contract.submitMessage(submission, {
                value: baseFee + deliveryFee
            });

            // Wait for transaction
            console.log("Waiting for transaction...");
            const receipt = await tx.wait();
            console.log("Transaction mined:", receipt.hash);

            // Check for event in receipt
            const event = receipt.logs.find((log) => log.topics[0] === contract.interface.getEvent("MessageSubmissionInitiated").topicHash);

            expect(event).toBeDefined();
            if (event) {
                const decodedEvent = contract.interface.parseLog({
                    topics: event.topics as string[],
                    data: event.data
                });
                console.log("Decoded event:", decodedEvent);
            }
        } catch (error) {
            console.error("Detailed error:", {
                error,
                message: error.message,
                code: error.code,
                ...(error.error && { nestedError: error.error.toString() })
            });
            throw error;
        }
    });
});
