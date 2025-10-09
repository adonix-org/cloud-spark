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

import { describe, it, expect } from "vitest";
import { cache } from "@src/middleware/cache/cache";
import { CacheHandler } from "@src/middleware/cache/handler";

describe("cache factory", () => {
    it("returns a cache handler instance with default config", () => {
        const mw = cache();
        expect(mw).toBeInstanceOf(CacheHandler);
    });

    it("accepts a cache name", () => {
        const mw = cache({ name: "my-cache" });
        expect(mw).toBeInstanceOf(CacheHandler);
    });
});
