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

import { describe, it, expect, beforeEach } from "vitest";
import { CacheWorker } from "../src/cache-worker";
import { env, ctx } from "./mock";
import { GET_REQUEST, VALID_ORIGIN, VALID_URL } from "./constants";
import { Method } from "../src/common";

class TestWorker extends CacheWorker {
    constructor(request: Request) {
        super(request, env, ctx);
    }

    public async fetch(): Promise<Response> {
        return new Response("OK");
    }

    public override async getCachedResponse(cacheName?: string): Promise<Response | undefined> {
        return super.getCachedResponse(cacheName);
    }

    public override async setCachedResponse(response: Response, cacheName?: string): Promise<void> {
        return super.setCachedResponse(response, cacheName);
    }

    public override addCacheHeaders(response: Response): Response {
        return super.addCacheHeaders(response);
    }
}

describe("cache worker unit tests", () => {
    it("returns undefined from cache", async () => {
        const worker = new TestWorker(GET_REQUEST);
        expect(await worker.getCachedResponse()).toBeUndefined();
        expect(await worker.getCachedResponse("test-cache")).toBeUndefined();
        await worker.setCachedResponse(new Response("OK"));
        await worker.setCachedResponse(new Response("OK"), "test-cache");
        expect(await worker.getCachedResponse()).toBeDefined();
        expect(await worker.getCachedResponse("test-cache")).toBeDefined();
    });

    it("adds cors headers to a response", async () => {
        const worker = new TestWorker(GET_REQUEST);
        const response = worker.addCacheHeaders(new Response("OK"));
        expect([...response.headers.entries()].length).toBe(1);
    });

    it("returns undefined if method is not GET", async () => {
        const worker = new TestWorker(new Request(VALID_URL, { method: Method.POST }));
        expect(await worker.getCachedResponse("")).toBeUndefined();
        expect(await worker.getCachedResponse("test-cache")).toBeUndefined();
    });
});
