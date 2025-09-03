import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        setupFiles: ["./tests/utils/setup.ts"],
        reporters: "verbose",
        testTimeout: 30000,
        watch: false,
        coverage: {
            reporter: ["text", "lcov"],
        },
    },
});
