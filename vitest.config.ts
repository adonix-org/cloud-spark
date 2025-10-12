/*
 * Copyright (C) 2025 Ty Busby
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import path from "path";

import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        setupFiles: ["./tests/test-utils/setup.ts"],
        reporters: "verbose",
        testTimeout: 30000,
        watch: false,
        coverage: {
            reporter: ["text", "lcov"],
            include: ["src/**"],
            exclude: ["src/debug/**"],
        },
    },
    resolve: {
        alias: {
            "@src": path.resolve(__dirname, "./src"),
            "@common": path.resolve(__dirname, "./tests/test-utils/common.ts"),
            "@mock": path.resolve(__dirname, "./tests/test-utils/mock.ts"),
        },
    },
});
