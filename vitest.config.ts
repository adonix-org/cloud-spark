import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        reporters: "verbose",
        testTimeout: 30000,
        watch: false,
    },
});
