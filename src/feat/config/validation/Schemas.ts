/**
 * File: /src/features/config/validation/schemas.ts
 * JSON Schema definitions for configuration validation
 */

/**
 * JSON Schema for core configuration
 */
export const coreConfigSchema = {
    type: "object",
    required: ["environment", "timeouts", "retry", "metrics"],
    properties: {
        environment: {
            type: "string",
            enum: ["development", "staging", "production"]
        },
        timeouts: {
            type: "object",
            required: ["defaultOperationTimeout", "maxOperationTimeout"],
            properties: {
                defaultOperationTimeout: {
                    type: "number",
                    minimum: 0
                },
                maxOperationTimeout: {
                    type: "number",
                    minimum: 0
                }
            }
        },
        retry: {
            type: "object",
            required: ["defaultMaxAttempts", "defaultRetryDelay", "useExponentialBackoff"],
            properties: {
                defaultMaxAttempts: {
                    type: "number",
                    minimum: 0
                },
                defaultRetryDelay: {
                    type: "number",
                    minimum: 0
                },
                useExponentialBackoff: {
                    type: "boolean"
                }
            }
        },
        metrics: {
            type: "object",
            required: ["enabled", "collectionInterval", "maxHistory"],
            properties: {
                enabled: {
                    type: "boolean"
                },
                collectionInterval: {
                    type: "number",
                    minimum: 100
                },
                maxHistory: {
                    type: "number",
                    minimum: 1
                }
            }
        }
    }
};
