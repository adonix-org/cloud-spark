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

import { describe, expect, it } from "vitest";
import { GET_REQUEST, VALID_ORIGIN, VALID_URL } from "@common";
import { ctx, defaultCache, env, namedCache } from "@mock";
import { cache } from "@src/middleware/cache/handler";
import { MiddlewareWorker } from "@src/workers/middleware-worker";
import { GET, Method } from "@src/constants/http";
import { getVaryHeader, getVaryKey } from "@src/middleware/cache/utils";

class TestWorker extends MiddlewareWorker {
    public getAllowedMethods(): Method[] {
        return [GET];
    }

    constructor(request: Request, cacheName?: string) {
        super(request, env, ctx);
        this.use(cache(cacheName));
    }

    protected async dispatch(): Promise<Response> {
        return new Response("from dispatch");
    }
}

class TestVaryWorker extends TestWorker {
    constructor(
        request: Request,
        public readonly vary: string,
    ) {
        super(request);
        this.use(cache());
    }

    protected override async dispatch(): Promise<Response> {
        return new Response("from dispatch", { headers: { Vary: this.vary } });
    }
}

describe("cache worker unit tests", () => {
    it("returns response from dispatch on default cache miss", async () => {
        const worker = new TestWorker(GET_REQUEST);
        const response = await worker.fetch();
        expect(await response.text()).toBe("from dispatch");
    });

    it("returns response from default cache hit", async () => {
        defaultCache.put(GET_REQUEST, new Response("from default cache"));
        const worker = new TestWorker(GET_REQUEST);
        const response = await worker.fetch();
        expect(await response.text()).toBe("from default cache");
    });

    it("returns response from dispatch on named cache miss", async () => {
        const worker = new TestWorker(GET_REQUEST, "named-cache");
        const response = await worker.fetch();
        expect(await response.text()).toBe("from dispatch");
    });

    it("returns response from named cache hit", async () => {
        namedCache.put(VALID_URL, new Response("from named cache"));
        const worker = new TestWorker(GET_REQUEST, "named-cache");
        const response = await worker.fetch();
        expect(await response.text()).toBe("from named cache");
    });

    it("adds response to default cache", async () => {
        const worker = new TestWorker(GET_REQUEST);
        await worker.fetch();
        expect(defaultCache.size).toBe(1);
        expect(namedCache.size).toBe(0);
        expect(await defaultCache.match(VALID_URL)?.text()).toBe("from dispatch");
    });

    it("adds response to named cache", async () => {
        const worker = new TestWorker(GET_REQUEST, "named-cache");
        await worker.fetch();
        expect(defaultCache.size).toBe(0);
        expect(namedCache.size).toBe(1);
        expect(await namedCache.match(VALID_URL)?.text()).toBe("from dispatch");
    });

    it("allows overriding get cache key", async () => {
        const url = new URL(VALID_URL);
        url.searchParams.set("b", "2");
        url.searchParams.set("c", "3");
        url.searchParams.set("a", "1");

        class CacheWorker extends MiddlewareWorker {
            public getAllowedMethods(): Method[] {
                return [GET];
            }
            protected async dispatch(): Promise<Response> {
                return new Response("from dispatch");
            }
            constructor(request: Request) {
                super(request, env, ctx);
                this.use(
                    cache(undefined, (): URL => {
                        return url;
                    }),
                );
            }
        }

        const worker = new CacheWorker(new Request(url));
        await worker.fetch();

        expect(defaultCache.size).toBe(1);
        expect(defaultCache.match("https://localhost/?b=2&c=3&a=1")).toBeDefined();
    });

    it("does not return cached responses for non-GET method", async () => {
        const get = new Request(VALID_URL, { method: "GET" });
        const post = new Request(VALID_URL, { method: "POST" });
        defaultCache.put(VALID_URL, new Response("from cache"));

        const response = await new TestWorker(get).fetch();
        expect(await response.text()).toBe("from cache");

        const response2 = await new TestWorker(post).fetch();
        expect(await response2.text()).toBe("from dispatch");
    });

    it("stores a 'vary aware' response", async () => {
        const request = new Request(VALID_URL, { method: GET, headers: { Origin: VALID_ORIGIN } });

        const response = await new TestVaryWorker(request, "Origin").fetch();
        const key = getVaryKey(request, getVaryHeader(response));

        expect(defaultCache.size).toBe(2);

        expect(defaultCache.match(key)).toBeDefined();
    });

    it("retrieves a 'vary aware' response", async () => {
        const request = new Request(VALID_URL, { method: GET, headers: { Origin: VALID_ORIGIN } });
        const vary = new Response("vary", { headers: { Vary: "origin" } });
        const resp = new Response("main", { headers: { Vary: "origin" } });
        const key = getVaryKey(request, getVaryHeader(resp));

        defaultCache.put(VALID_URL, resp);
        defaultCache.put(key, vary);

        const response = await new TestWorker(request).fetch();
        expect(await response.text()).toBe("vary");
    });

    it("does not cache 'uncacheable' responses", async () => {
        class BadResponseWorker extends TestWorker {
            protected async dispatch(): Promise<Response> {
                return new Response("do not cache", { status: 500 });
            }
        }

        const response = await new BadResponseWorker(GET_REQUEST).fetch();
        expect(response.status).toBe(500);
        expect(defaultCache.size).toBe(0);
        expect(namedCache.size).toBe(0);
    });
});
