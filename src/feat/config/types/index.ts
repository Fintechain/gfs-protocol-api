/**
 * File: /src/features/config/types/index.ts
 * Root configuration type definitions
 */

import { CoreConfiguration } from "./Core.js";
import { LoggingConfiguration } from "./Logging.js";
import { MessagingConfiguration } from "./Messaging.js";
import { BlockchainConfiguration } from "./Network.js";

/**
 * Root configuration type that combines all feature configurations
 */
export interface SystemConfiguration {
    /** Core system configuration */
    core: CoreConfiguration;
    /** Messaging feature configuration */
    messaging: MessagingConfiguration;
    /** Blockchain feature configuration */
    blockchain: BlockchainConfiguration;
    /** Logging configuration */
    logging: LoggingConfiguration;
}

export * from "./Core.js";
export * from "./Loader.js";
export * from "./Logging.js";
export * from "./Messaging.js";
export * from "./Network.js";
