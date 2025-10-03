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

import { beforeEach, describe, expect, it } from "vitest";
import { Worker } from "@src/interfaces/worker";
import { CachePolicy } from "@src/middleware/cache/policy";

describe("cache policy", () => {
    let worker: Worker;
    let policy: CachePolicy;
    let cachedResponse: Response;

    beforeEach(() => {
        worker = { request: new Request("https://example.com") } as unknown as Worker;
        policy = new CachePolicy();
        cachedResponse = new Response("cached", { status: 200 });
    });

    it("returns cached response if no rules are registered", async () => {
        const result = await policy.execute(worker, async () => cachedResponse);
        expect(result).toBe(cachedResponse);
    });

    it("returns undefined if cached response is missing", async () => {
        const result = await policy.execute(worker, async () => undefined);
        expect(result).toBeUndefined();
    });

    it("applies rules in correct order", async () => {
        const order: string[] = [];
        policy.use(
            {
                apply: async (_w, next) => {
                    order.push("pre-first");
                    const response = await next();
                    order.push("post-first");
                    return response;
                },
            },
            {
                apply: async (_w, next) => {
                    order.push("pre-second");
                    const response = await next();
                    order.push("post-second");
                    return response;
                },
            },
        );

        await policy.execute(worker, async () => cachedResponse);
        expect(order).toEqual(["pre-first", "pre-second", "post-second", "post-first"]);
    });
});
