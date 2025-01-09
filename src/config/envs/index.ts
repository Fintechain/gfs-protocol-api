// src/config/env/index.ts
import dotenv from "dotenv-flow";

import { Env } from "./types.js";

process.env.NODE_ENV = process.env.NODE_ENV || "development";

export const config = dotenv.config();
export const isProduction = process.env.NODE_ENV === "production";
export const envs = process.env;

export * from "./types.js";

// src/config/env/index.ts
export const loadEnv = (): Env => {
    return {
        NODE_ENV: envs.NODE_ENV || "development",
        PORT: parseInt(envs.PORT || "8083", 10),

        // Database
        DB_HOST: envs.DB_HOST || "localhost",
        DB_PORT: parseInt(envs.DB_PORT || "5432", 10),
        DB_USER: envs.DB_USER || "postgres",
        DB_PASSWORD: envs.DB_PASSWORD || "postgres",
        DB_NAME: envs.DB_NAME || "gfsdb",

        // Blockchain
        RPC_URL: envs.RPC_URL || "",
        COORDINATOR_CONTRACT_ADDRESS: envs.COORDINATOR_CONTRACT_ADDRESS || "",
        PRIVATE_KEY: envs.PRIVATE_KEY || "",
        TOKEN_CONTRACT_ADDRESS: envs.TOKEN_CONTRACT_ADDRESS || "",
        MESSAGE_HANDLER_ADDRESS: envs.MESSAGE_HANDLER_ADDRESS || "",

        // Redis
        REDIS_HOST: envs.REDIS_HOST || "localhost",
        REDIS_PORT: parseInt(envs.REDIS_PORT || "6379", 10),
        REDIS_PASSWORD: envs.REDIS_PASSWORD || ""
    };
};
