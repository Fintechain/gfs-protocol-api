// src/features/messages/types/Events.ts
import { Message } from "../models/Message.js";

// Event interfaces
export interface MessageEvent {
    messageId: string;
    timestamp: Date;
    type: string;
}

export interface MessageCreatedEvent extends MessageEvent {
    message: Message;
}

export interface MessageSubmittedEvent extends MessageEvent {
    message: Message;
    transactionHash: string;
}

export interface MessageFailedEvent extends MessageEvent {
    message: Message;
    error: Error;
}
