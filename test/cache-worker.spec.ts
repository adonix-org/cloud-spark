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
import { env, ctx, defaultCache, namedCache } from "./mock";
import { GET_REQUEST_WITH_ORIGIN, VALID_ORIGIN, VALID_URL } from "./constants";
import { Method } from "../src/common";
import { addCorsHeaders } from "../src/cors";

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
    let worker: TestWorker;

    beforeEach(() => {
        worker = new TestWorker(GET_REQUEST_WITH_ORIGIN);
        defaultCache.clear();
        namedCache.clear();
    });

    it("returns undefined from default cache on miss", async () => {
        expect(await worker.getCachedResponse()).toBeUndefined();
    });

    it("returns undefined from named cache on miss", async () => {
        expect(await worker.getCachedResponse("test-cache")).toBeUndefined();
    });

    it("adds response to default cache", async () => {
        await worker.setCachedResponse(new Response("DEFAULT CACHE"));
        expect(defaultCache.size).toBe(1);
        expect(await defaultCache.match(VALID_URL)?.text()).toBe("DEFAULT CACHE");
    });

    it("adds response to named cache", async () => {
        await worker.setCachedResponse(new Response("NAMED CACHE"), "test-cache");
        expect(namedCache.size).toBe(1);
        expect(await namedCache.match(VALID_URL)?.text()).toBe("NAMED CACHE");
    });

    it("returns response from default cache on hit", async () => {
        defaultCache.put(VALID_URL, new Response("DEFAULT HIT"));

        const response = await worker.getCachedResponse();
        expect(await response?.text()).toBe("DEFAULT HIT");
    });

    it("returns response from named cache on hit", async () => {
        defaultCache.put(VALID_URL, new Response("NAMED HIT"));

        const response = await worker.getCachedResponse();
        expect(await response?.text()).toBe("NAMED HIT");
    });

    it("does not store cors headers in cache", async () => {
        const headers = new Headers();
        addCorsHeaders(VALID_ORIGIN, worker, headers);

        const response = worker.addCacheHeaders(new Response("-CORS", { headers }));
        expect([...response.headers.entries()]).toStrictEqual([
            ["access-control-allow-headers", "Content-Type"],
            ["access-control-allow-methods", "GET, HEAD, OPTIONS"],
            ["access-control-allow-origin", "*"],
            ["access-control-max-age", "604800"],
            ["content-type", "text/plain;charset=UTF-8"],
        ]);
        worker.setCachedResponse(response);

        const cached = defaultCache.match(VALID_URL);
        expect(await cached!.text()).toBe("-CORS");
        expect([...cached!.headers.entries()]).toStrictEqual([
            ["content-type", "text/plain;charset=UTF-8"],
        ]);
    });

    it("adds cors headers before returning cached response", async () => {
        const response = new Response("+CORS");
        expect([...response!.headers.entries()]).toStrictEqual([
            ["content-type", "text/plain;charset=UTF-8"],
        ]);

        defaultCache.put(VALID_URL, response);

        const cached = await worker.getCachedResponse();
        expect(await cached!.text()).toBe("+CORS");
        expect([...cached!.headers.entries()]).toStrictEqual([
            ["access-control-allow-headers", "Content-Type"],
            ["access-control-allow-methods", "GET, HEAD, OPTIONS"],
            ["access-control-allow-origin", "*"],
            ["access-control-max-age", "604800"],
            ["content-type", "text/plain;charset=UTF-8"],
        ]);
    });

    it("only caches responses from GET method", async () => {
        const postWorker = new TestWorker(new Request(VALID_URL, { method: Method.POST }));
        postWorker.setCachedResponse(new Response("POST"));
        expect(defaultCache.match(VALID_URL)).toBeUndefined();
        expect(defaultCache.size).toBe(0);
    });

    it("only returns responses from GET method", async () => {
        const postWorker = new TestWorker(new Request(VALID_URL, { method: Method.POST }));
        defaultCache.put(VALID_URL, new Response("+CORS"));
        expect(defaultCache.size).toBe(1);
        expect(defaultCache.match(VALID_URL)).toBeInstanceOf(Response);

        const response = await postWorker.getCachedResponse();
        expect(response).toBeUndefined();
    });
});
