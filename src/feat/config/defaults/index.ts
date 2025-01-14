/**
 * File: /src/features/config/defaults/index.ts
 * Default configuration values
 */

import { SystemConfiguration } from "../types/index.js";

/**
 * Default system configuration
 */
export const defaultConfig: SystemConfiguration = {
    core: {
        environment: "development",
        timeouts: {
            defaultOperationTimeout: 30000,
            maxOperationTimeout: 300000
        },
        retry: {
            defaultMaxAttempts: 3,
            defaultRetryDelay: 1000,
            useExponentialBackoff: true
        },
        metrics: {
            enabled: true,
            collectionInterval: 1000,
            maxHistory: 1000
        }
    },
    messaging: {
        pipelines: {
            validation: {
                maxConcurrent: 10,
                cacheResults: true,
                cacheTTL: 300000
            },
            transformation: {
                maxConcurrent: 5,
                cacheResults: true,
                cacheTTL: 300000
            },
            processing: {
                maxConcurrent: 3,
                cacheResults: false
            }
        },
        services: {
            messageProcessing: {
                queue: {
                    maxSize: 1000,
                    processingTimeout: 60000
                },
                circuitBreaker: {
                    failureThreshold: 5,
                    resetTimeout: 60000
                }
            }
        }
    },
    blockchain: {
        network: {
            url: "http://localhost:8545",
            chainId: 1,
            secure: true
        },
        auth: {},
        transaction: {
            defaultGasLimit: 2000000,
            maxGasPrice: "100000000000",
            useEip1559: true,
            confirmationBlocks: 12
        },
        contracts: {
            protocolCoordinator: "",
            messageRegistry: ""
        }
    },
    logging: {
        level: "info",
        timestamp: true,
        traceId: true,
        transports: [
            {
                type: "console",
                options: {}
            }
        ]
    }
};
