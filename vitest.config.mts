import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        globals: true,
        root: "./",
        coverage: {
            include: ["src/**/*.ts", "lib/**/*.js"], // Include relevant source files
            exclude: [
                "src/**/*.spec.ts", // Exclude test files
                "src/**/__mocks__/**", // Exclude mock files
                "node_modules/**",    // Exclude dependencies
                "dist/**",            // Exclude build files
            ],
            all: true, // Analyze all matching files, even if not directly imported
            reporter: ["text", "html"], // Output coverage reports in text and HTML formats
            reportsDirectory: "./coverage", // Directory for coverage reports
        },
    },
    plugins: [
        // This is required to build the test files with SWC
        swc.vite({
            module: { type: "es6" }, // Explicitly set the module type
            jsc: {
                transform: {
                    useDefineForClassFields: false,
                },
            },
        }),
    ],
});
