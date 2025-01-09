// src/config/env/types.ts
export interface Env {
    // Node environment
    NODE_ENV: string;
    PORT: number;

    // Database
    DB_HOST: string;
    DB_PORT: number;
    DB_USER: string;
    DB_PASSWORD: string;
    DB_NAME: string;

    // Blockchain
    RPC_URL: string;
    COORDINATOR_CONTRACT_ADDRESS: string;
    PRIVATE_KEY: string;
    TOKEN_CONTRACT_ADDRESS: string; // Added for ERC20 token
    MESSAGE_HANDLER_ADDRESS: string; // Added for message handler

    // Redis
    REDIS_HOST: string;
    REDIS_PORT: number;
    REDIS_PASSWORD: string;
}

// TSEd Configuration extension
declare global {
    namespace TsED {
        interface Configuration {
            env: Env;
        }
    }
}
