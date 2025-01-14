/**
 * File: /src/features/config/loaders/__tests__/ConfigurationService.spec.ts
 * Tests for the Configuration Service
 */

import { readFile } from "fs/promises";
import { join } from "path";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ConfigurationService, ConfigurationServiceOptions } from "../ConfigurationService.js";

// Mock fs/promises
vi.mock("fs/promises", () => ({
    readFile: vi.fn()
}));

describe("ConfigurationService", () => {
    let service: ConfigurationService;
    let options: ConfigurationServiceOptions;

    const mockDefaultConfig = {
        core: {
            environment: "development",
            metrics: {
                enabled: true
            }
        },
        blockchain: {
            network: {
                url: "http://localhost:8545"
            }
        }
    };

    const mockEnvConfig = {
        core: {
            environment: "production",
            metrics: {
                enabled: false
            }
        }
    };

    beforeEach(() => {
        // Reset mocks
        vi.clearAllMocks();

        // Setup default options
        options = {
            configPath: "/config/default.json",
            environment: "production"
        };

        // Create service instance
        service = new ConfigurationService(options);

        // Mock process.cwd()
        vi.spyOn(process, "cwd").mockReturnValue("/app");
    });

    describe("load", () => {
        it("should load and merge default and environment configurations", async () => {
            // Mock file reads
            const readFileMock = vi.mocked(readFile);
            readFileMock.mockResolvedValueOnce(JSON.stringify(mockDefaultConfig)).mockResolvedValueOnce(JSON.stringify(mockEnvConfig));

            const config = await service.load();

            // Verify correct paths were used
            expect(readFileMock).toHaveBeenCalledWith(join("/app", "/config/default.json"), "utf-8");
            expect(readFileMock).toHaveBeenCalledWith(join("/app", "/config/production.json"), "utf-8");

            // Verify merged configuration
            expect(config).toEqual({
                core: {
                    environment: "production",
                    metrics: {
                        enabled: false
                    }
                },
                blockchain: {
                    network: {
                        url: "http://localhost:8545"
                    }
                }
            });
        });

        it("should use cache on subsequent calls", async () => {
            const readFileMock = vi.mocked(readFile);
            readFileMock.mockResolvedValueOnce(JSON.stringify(mockDefaultConfig)).mockResolvedValueOnce(JSON.stringify(mockEnvConfig));

            // First call should read files
            await service.load();
            expect(readFileMock).toHaveBeenCalledTimes(2);

            // Second call should use cache
            await service.load();
            expect(readFileMock).toHaveBeenCalledTimes(2);
        });

        it("should handle missing environment config gracefully", async () => {
            const readFileMock = vi.mocked(readFile);
            readFileMock.mockResolvedValueOnce(JSON.stringify(mockDefaultConfig)).mockRejectedValueOnce(new Error("File not found"));

            const config = await service.load();

            // Should use default config when env config is missing
            expect(config).toEqual(mockDefaultConfig);
        });

        it("should throw error when default config cannot be loaded", async () => {
            const readFileMock = vi.mocked(readFile);
            readFileMock.mockRejectedValueOnce(new Error("File not found"));

            await expect(service.load()).rejects.toThrow("Failed to load configuration");
        });

        it("should handle invalid JSON in config files", async () => {
            const readFileMock = vi.mocked(readFile);
            readFileMock.mockResolvedValueOnce("invalid json");

            await expect(service.load()).rejects.toThrow("Failed to load configuration");
        });
    });

    describe("getConfig", () => {
        it("should load config if not cached", async () => {
            const readFileMock = vi.mocked(readFile);
            readFileMock.mockResolvedValueOnce(JSON.stringify(mockDefaultConfig)).mockResolvedValueOnce(JSON.stringify(mockEnvConfig));

            const config = await service.getConfig();

            expect(readFileMock).toHaveBeenCalledTimes(2);
            expect(config.core?.environment).toBe("production");
        });

        it("should return cached config if available", async () => {
            const readFileMock = vi.mocked(readFile);
            readFileMock.mockResolvedValueOnce(JSON.stringify(mockDefaultConfig)).mockResolvedValueOnce(JSON.stringify(mockEnvConfig));

            // Load config first time
            await service.getConfig();

            // Should use cache second time
            const config = await service.getConfig();
            expect(readFileMock).toHaveBeenCalledTimes(2);
            expect(config.core?.environment).toBe("production");
        });
    });

    describe("reloadConfig", () => {
        it("should force reload configuration from disk", async () => {
            const readFileMock = vi.mocked(readFile);
            readFileMock
                .mockResolvedValueOnce(JSON.stringify(mockDefaultConfig))
                .mockResolvedValueOnce(JSON.stringify(mockEnvConfig))
                .mockResolvedValueOnce(JSON.stringify({ ...mockDefaultConfig, core: { environment: "staging" } }))
                .mockResolvedValueOnce(JSON.stringify({ ...mockEnvConfig, core: { environment: "test" } }));

            // Initial load
            const initialConfig = await service.load();
            expect(initialConfig.core?.environment).toBe("production");

            // Force reload
            const reloadedConfig = await service.reloadConfig();
            expect(reloadedConfig.core?.environment).toBe("test");
            expect(readFileMock).toHaveBeenCalledTimes(4);
        });
    });

    describe("mergeConfigurations", () => {
        it("should correctly merge nested objects", async () => {
            const readFileMock = vi.mocked(readFile);
            readFileMock
                .mockResolvedValueOnce(
                    JSON.stringify({
                        core: {
                            metrics: {
                                enabled: true,
                                interval: 1000
                            },
                            timeouts: {
                                default: 5000
                            }
                        }
                    })
                )
                .mockResolvedValueOnce(
                    JSON.stringify({
                        core: {
                            metrics: {
                                enabled: false,
                                maxHistory: 100
                            }
                        }
                    })
                );

            const config = await service.load();

            expect(config.core?.metrics).toEqual({
                enabled: false,
                interval: 1000,
                maxHistory: 100
            });
            expect(config.core?.timeouts).toEqual({
                default: 5000
            });
        });

        it("should handle arrays in configuration", async () => {
            const readFileMock = vi.mocked(readFile);
            readFileMock
                .mockResolvedValueOnce(
                    JSON.stringify({
                        logging: {
                            transports: [{ type: "console" }]
                        }
                    })
                )
                .mockResolvedValueOnce(
                    JSON.stringify({
                        logging: {
                            transports: [{ type: "file" }]
                        }
                    })
                );

            const config = await service.load();

            expect(config.logging?.transports).toEqual([{ type: "file" }]);
        });

        it("should handle null and undefined values", async () => {
            const readFileMock = vi.mocked(readFile);
            readFileMock
                .mockResolvedValueOnce(
                    JSON.stringify({
                        core: {
                            feature1: null,
                            feature2: "active"
                        }
                    })
                )
                .mockResolvedValueOnce(
                    JSON.stringify({
                        core: {
                            feature1: "override",
                            feature2: null
                        }
                    })
                );

            const config = await service.load();

            expect((config.core as any).feature1).toBe("override");
            expect((config.core as any).feature2).toBeNull();
        });
    });
});
