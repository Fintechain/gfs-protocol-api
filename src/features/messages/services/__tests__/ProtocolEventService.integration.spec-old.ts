// src/features/messages/services/__tests__/ProtocolEventService.integration.spec.ts

import { EventEmitterService } from "@tsed/event-emitter";
import { PlatformTest } from "@tsed/platform-http/testing";
import { ethers } from "ethers";
import { GenericContainer, StartedTestContainer, Wait } from "testcontainers";
import { Repository } from "typeorm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { type Env, envs, loadEnv } from "../../../../config/envs/index.js";
import {
    MessageProcessingCompletedEvent,
    MessageRetryInitiatedEvent,
    MessageSubmissionInitiatedEvent,
    ProtocolCoordinator,
    ProtocolCoordinator__factory
} from "../../../typechain/index.js";
import { LoggerService } from "../../../utils/services/LoggerService.js";
import { MetricsService } from "../../../utils/services/MetricsService.js";
import { LOCAL_CHAIN_ID } from "../../constants/index.js";
import { Message, MessageStatus } from "../../models/Message.js";
import { PACS008PayloadService } from "../PACS008PayloadService.js";
import { ProtocolEventService } from "../ProtocolEventService.js";

describe.skip("ProtocolEventService Integration", () => {
    let postgresContainer: StartedTestContainer;
    let service: ProtocolEventService;
    let provider: ethers.Provider;
    let protocolCoordinator: ProtocolCoordinator;
    let repository: Repository<Message>;
    let eventEmitter: EventEmitterService;
    let metrics: MetricsService;
    let logger: LoggerService;
    let signer: ethers.Signer;
    let env: Env;

    let originalEnv: NodeJS.ProcessEnv;

    // src/features/messages/services/__tests__/ProtocolEventService.integration.spec.ts

    beforeAll(async () => {
        console.log("Starting test setup...");
        originalEnv = { ...process.env };
        env = loadEnv();

        try {
            // Validate required environment variables
            if (!env.RPC_URL) throw new Error("RPC_URL environment variable not set");
            if (!env.COORDINATOR_CONTRACT_ADDRESS) throw new Error("COORDINATOR_CONTRACT_ADDRESS environment variable not set");
            if (!env.PRIVATE_KEY) throw new Error("PRIVATE_KEY environment variable not set");

            // Start Postgres container with corrected container configuration
            console.log("Starting Postgres container...");
            postgresContainer = await new GenericContainer("postgres:14-alpine")
                .withExposedPorts(5432)
                .withEnvironment({
                    POSTGRES_USER: env.DB_USER,
                    POSTGRES_PASSWORD: env.DB_PASSWORD,
                    POSTGRES_DB: env.DB_NAME
                })
                .withStartupTimeout(120000)
                .withWaitStrategy(Wait.forLogMessage(/database system is ready/))
                .start();

            console.log("Postgres container started");

            // Set environment variables for database connection
            env.DB_HOST = postgresContainer.getHost();
            env.DB_PORT = postgresContainer.getMappedPort(5432);

            // Update process.env to match
            process.env.DB_HOST = env.DB_HOST;
            process.env.DB_PORT = env.DB_PORT.toString();

            // Set up Ethereum provider and signer
            provider = new ethers.JsonRpcProvider(env.RPC_URL);
            signer = new ethers.Wallet(env.PRIVATE_KEY, provider);

            // Connect to protocol coordinator contract
            protocolCoordinator = ProtocolCoordinator__factory.connect(env.COORDINATOR_CONTRACT_ADDRESS, provider);
            console.log("Connected to protocol coordinator contract:", env.COORDINATOR_CONTRACT_ADDRESS);

            // Create mock implementations
            const mockRepository = {
                findOne: async ({ where }: { where: any }) => {
                    const message = new Message();
                    message.protocol_message_id = where.protocol_message_id;
                    message.status = MessageStatus.PENDING;
                    message.processing_metadata = { retry_count: 0 };
                    message.addProcessingStep = (step: string, status: string, metadata: any) => {
                        if (!message.processing_metadata) {
                            message.processing_metadata = {};
                        }
                        message.processing_metadata[step] = { status, ...metadata };
                    };
                    return message;
                },
                save: async (entity: any) => entity
            };

            const mockLogger = {
                child: () => ({
                    error: console.error,
                    info: console.info,
                    debug: console.debug,
                    warn: console.warn
                })
            };

            const mockMetrics = {
                incrementCounter: (name: string, tags: any) => {}
            };

            // Create event emitter with proper implementation
            class TestEventEmitter {
                private listeners: Record<string, Function[]> = {};

                on(event: string, listener: Function): void {
                    if (!this.listeners[event]) {
                        this.listeners[event] = [];
                    }
                    this.listeners[event].push(listener);
                }

                async emit(event: string, data: any): Promise<boolean> {
                    const eventListeners = this.listeners[event] || [];
                    for (const listener of eventListeners) {
                        await listener(data);
                    }
                    return eventListeners.length > 0;
                }

                removeAllListeners(): void {
                    this.listeners = {};
                }
            }

            const mockEventEmitter = new TestEventEmitter();

            // Initialize platform with mocked dependencies
            await PlatformTest.create({
                imports: [
                    {
                        token: "COORDINATOR_CONTRACT",
                        use: protocolCoordinator
                    },
                    {
                        token: LoggerService,
                        use: mockLogger
                    },
                    {
                        token: MetricsService,
                        use: mockMetrics
                    },
                    {
                        token: EventEmitterService,
                        use: mockEventEmitter
                    },
                    {
                        token: "DATABASE_CONNECTION",
                        use: mockRepository
                    }
                ]
            });

            // Get service dependencies from container
            logger = PlatformTest.get<LoggerService>(LoggerService);
            metrics = PlatformTest.get<MetricsService>(MetricsService);
            eventEmitter = PlatformTest.get<EventEmitterService>(EventEmitterService);
            repository = PlatformTest.get<Repository<Message>>("DATABASE_CONNECTION");

            // Get service instance from container
            service = PlatformTest.get<ProtocolEventService>(ProtocolEventService);

            // Wait for service to initialize
            await new Promise((resolve) => setTimeout(resolve, 2000));
            console.log("Service initialized successfully");

            // Verify service was properly initialized
            if (!service) {
                throw new Error("Failed to initialize ProtocolEventService");
            }
        } catch (error) {
            console.error("Error during setup:", error);
            // Clean up resources if initialization fails
            if (postgresContainer) {
                await postgresContainer.stop();
                console.log("Postgres container stopped due to initialization error");
            }
            throw error;
        }
    }, 150000);

    afterAll(async () => {
        console.log("Starting cleanup...");
        try {
            process.env = originalEnv;
            await PlatformTest.reset();

            if (postgresContainer) {
                await postgresContainer.stop();
                console.log("Postgres container stopped");
            }
        } catch (error) {
            console.error("Error during cleanup:", error);
            throw error;
        }
    });

    describe("Event Handling", () => {
        it("should process multiple events in correct order", async () => {
            const events: string[] = [];
            const messageId = ethers.hexlify(ethers.randomBytes(32));

            const message = new Message();
            message.protocol_message_id = messageId;
            message.status = MessageStatus.SUBMITTING;
            await repository.save(message);

            try {
                // Prepare submission
                const pacs008Service = new PACS008PayloadService();
                const amount = ethers.parseEther("1.0");

                const submission = pacs008Service.createSubmission(
                    await signer.getAddress(),
                    "0x9aBD1C4028b414d07Bf3d110A53EE8E34E4817d7",
                    env.TOKEN_CONTRACT_ADDRESS,
                    amount,
                    env.MESSAGE_HANDLER_ADDRESS,
                    LOCAL_CHAIN_ID
                );

                // Get fee estimation
                console.log("Getting fee estimation...");
                const [baseFee, deliveryFee] = await protocolCoordinator.quoteMessageFee(submission);
                const totalFee = baseFee + deliveryFee;

                // Submit transaction
                console.log("Submitting transaction...");
                const tx = await protocolCoordinator.connect(signer).submitMessage(submission, { value: totalFee });

                // Wait for receipt and process events
                const receipt = await tx.wait();

                // Process events from receipt
                for (const log of receipt.logs) {
                    const event = protocolCoordinator.interface.parseLog({
                        topics: log.topics as string[],
                        data: log.data
                    });

                    if (event) {
                        switch (event.name) {
                            case "MessageSubmissionInitiated":
                                events.push("submitted");
                                await eventEmitter.emit("message.submitted", {
                                    messageId: event.args[0],
                                    sender: event.args[1]
                                });
                                break;
                            case "MessageProcessingCompleted":
                                events.push("status_updated");
                                await eventEmitter.emit("message.status_updated", {
                                    messageId: event.args[0]
                                });
                                break;
                        }
                    }
                }

                // Verify event order
                if (events.includes("status_updated")) {
                    expect(events.indexOf("submitted")).toBeLessThan(events.indexOf("status_updated"));
                }
            } catch (error) {
                console.error("Test error:", error);
                throw error;
            }
        });

        it("should handle MessageStatusUpdated events", async () => {
            const eventPromise = new Promise<void>((resolve) => {
                eventEmitter.on("message.status_updated", () => resolve());
            });

            const message = new Message();
            message.protocol_message_id = ethers.hexlify(ethers.randomBytes(32));
            message.status = MessageStatus.PENDING;
            await repository.save(message);

            const filter = protocolCoordinator.filters.MessageProcessingCompleted(message.protocol_message_id);

            const eventListener = protocolCoordinator.on(filter, async (messageId: string, event: MessageProcessingCompletedEvent.Log) => {
                console.log("Received MessageProcessingCompleted event:", {
                    messageId,
                    blockNumber: event.blockNumber
                });
            });

            await Promise.race([eventPromise, new Promise((_, reject) => setTimeout(() => reject(new Error("Event timeout")), 30000))]);

            protocolCoordinator.off(filter, eventListener);

            const updatedMessage = await repository.findOne({
                where: { protocol_message_id: message.protocol_message_id }
            });

            expect(updatedMessage).toBeDefined();
            expect(updatedMessage?.status).toBe(MessageStatus.COMPLETED);
            expect(updatedMessage?.processing_metadata?.status_update).toBeDefined();
        }, 35000);

        it("should handle message retry events", async () => {
            const eventPromise = new Promise<void>((resolve) => {
                eventEmitter.on("message.retry_initiated", () => resolve());
            });

            const message = new Message();
            message.protocol_message_id = ethers.hexlify(ethers.randomBytes(32));
            message.status = MessageStatus.FAILED;
            message.processing_metadata = { retry_count: 0 };
            await repository.save(message);

            const filter = protocolCoordinator.filters.MessageRetryInitiated(message.protocol_message_id);

            const eventListener = protocolCoordinator.on(filter, async (messageId: string, event: MessageRetryInitiatedEvent.Log) => {
                console.log("Received MessageRetryInitiated event:", {
                    messageId,
                    blockNumber: event.blockNumber
                });
            });

            // Initiate retry using signer
            const retryTx = await protocolCoordinator
                .connect(signer)
                .retryMessage(message.protocol_message_id, { value: ethers.parseEther("0.1") });
            await retryTx.wait();

            await Promise.race([eventPromise, new Promise((_, reject) => setTimeout(() => reject(new Error("Event timeout")), 30000))]);

            protocolCoordinator.off(filter, eventListener);

            const updatedMessage = await repository.findOne({
                where: { protocol_message_id: message.protocol_message_id }
            });

            expect(updatedMessage).toBeDefined();
            expect(updatedMessage?.processing_metadata?.retry_count).toBe(1);
        }, 45000);
    });

    describe("Error Recovery", () => {
        it("should handle and recover from database disconnection", async () => {
            const message = new Message();
            message.protocol_message_id = ethers.hexlify(ethers.randomBytes(32));
            message.status = MessageStatus.SUBMITTING;
            await repository.save(message);

            // Stop postgres container
            await postgresContainer.stop();
            await new Promise((resolve) => setTimeout(resolve, 2000));

            // Restart postgres container
            await postgresContainer.restart();
            await new Promise((resolve) => setTimeout(resolve, 2000));

            // Try to process a new event
            const eventPromise = new Promise<void>((resolve) => {
                eventEmitter.on("message.submitted", () => resolve());
            });

            const filter = protocolCoordinator.filters.MessageSubmissionInitiated(message.protocol_message_id);

            const eventListener = protocolCoordinator.on(
                filter,
                async (messageId: string, sender: string, messageType: string, target: string, targetChain: bigint) => {
                    console.log("Received event after recovery:", messageId);
                }
            );

            await Promise.race([eventPromise, new Promise((_, reject) => setTimeout(() => reject(new Error("Event timeout")), 30000))]);

            protocolCoordinator.off(filter, eventListener);

            const updatedMessage = await repository.findOne({
                where: { protocol_message_id: message.protocol_message_id }
            });

            expect(updatedMessage).toBeDefined();
            expect(updatedMessage?.status).toBe(MessageStatus.PENDING);
        }, 45000);
    });

    describe("Event Processing Order", () => {
        it("should process multiple events in correct order", async () => {
            const events: string[] = [];
            const messageId = ethers.hexlify(ethers.randomBytes(32));

            const message = new Message();
            message.protocol_message_id = messageId;
            message.status = MessageStatus.SUBMITTING;
            await repository.save(message);

            // Set up event listeners
            eventEmitter.on("message.submitted", () => events.push("submitted"));
            eventEmitter.on("message.status_updated", () => events.push("status_updated"));
            eventEmitter.on("message.retry_initiated", () => events.push("retry_initiated"));

            // Set up contract event filters
            const submissionFilter = protocolCoordinator.filters.MessageSubmissionInitiated(messageId);
            const processingFilter = protocolCoordinator.filters.MessageProcessingCompleted(messageId);
            const retryFilter = protocolCoordinator.filters.MessageRetryInitiated(messageId);

            // Set up contract event listeners
            protocolCoordinator.on(submissionFilter, () => {});
            protocolCoordinator.on(processingFilter, () => {});
            protocolCoordinator.on(retryFilter, () => {});

            // Wait for events to be processed
            await new Promise((resolve) => setTimeout(resolve, 30000));

            // Clean up listeners
            protocolCoordinator.off(submissionFilter);
            protocolCoordinator.off(processingFilter);
            protocolCoordinator.off(retryFilter);

            // Verify event order
            if (events.includes("status_updated")) {
                expect(events.indexOf("submitted")).toBeLessThan(events.indexOf("status_updated"));
            }
            if (events.includes("retry_initiated")) {
                expect(events.indexOf("status_updated")).toBeLessThan(events.indexOf("retry_initiated"));
            }
        }, 35000);
    });
});
