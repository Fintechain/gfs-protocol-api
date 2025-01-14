/**
 * File: /src/features/config/types/blockchain.types.ts
 * Blockchain feature configuration types
 */

/**
 * Configuration for the blockchain feature
 */
export interface BlockchainConfiguration {
    /** Network configuration */
    network: {
        /** Network URL */
        url: string;
        /** Network chain ID */
        chainId: number;
        /** Whether to use secure connection */
        secure: boolean;
    };
    /** Authentication configuration */
    auth: {
        /** Authentication token */
        token?: string;
        /** API key if required */
        apiKey?: string;
    };
    /** Transaction configuration */
    transaction: {
        /** Default gas limit */
        defaultGasLimit: number;
        /** Maximum gas price in wei */
        maxGasPrice: string;
        /** Whether to use EIP-1559 */
        useEip1559: boolean;
        /** Confirmation blocks required */
        confirmationBlocks: number;
    };
    /** Contract addresses */
    contracts: {
        /** Protocol coordinator address */
        protocolCoordinator: string;
        /** Message registry address */
        messageRegistry: string;
        /** Other contract addresses */
        [key: string]: string;
    };
}
