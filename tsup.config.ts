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

import { defineConfig } from "tsup";

export default defineConfig({
    entry: {
        index: "src/core.ts",
        cache: "src/middleware/cache/index.ts",
        cors: "src/middleware/cors/index.ts",
        websocket: "src/middleware/websocket/index.ts",
        sessions: "src/websocket/index.ts",
    },
    dts: true,
    clean: true,
    format: ["esm"],
    outDir: "dist",
    sourcemap: true,
    target: "es2022",
    minify: true,
    splitting: false,
    treeshake: true,
    bundle: true,
});
