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
import { decodeVaryKey, GET_REQUEST, VALID_ORIGIN, VALID_URL } from "@common";
import { ctx, defaultCache, env, namedCache } from "@mock";
import { cache, sortSearchParams, stripSearchParams } from "@src/middleware/cache/handler";
import { MiddlewareWorker } from "@src/workers/middleware";
import { GET, HttpHeader, Method } from "@src/constants/http";
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

describe("cache middleware unit tests", () => {
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

    it("normalizes search parameters by default", async () => {
        const url = new URL(VALID_URL);
        url.searchParams.set("b", "2");
        url.searchParams.set("c", "3");
        url.searchParams.set("a", "1");

        const worker = new TestWorker(new Request(url));
        await worker.fetch();

        expect(defaultCache.size).toBe(1);
        expect(defaultCache.match("https://localhost/?a=1&b=2&c=3")).toBeDefined();
    });

    it("allows users to create cache keys with stripped search parameters", async () => {
        const url = new URL(VALID_URL);
        url.searchParams.set("b", "2");
        url.searchParams.set("c", "3");
        url.searchParams.set("a", "1");

        class RemoveQueryWorker extends MiddlewareWorker {
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
                        return new URL(url.pathname, url.origin);
                    }),
                );
            }
        }

        const worker = new RemoveQueryWorker(new Request(url));
        await worker.fetch();

        expect(defaultCache.size).toBe(1);
        expect(defaultCache.match("https://localhost/")).toBeDefined();
    });

    it("allows overriding get cache key", async () => {
        const url = new URL(VALID_URL);
        url.searchParams.set("b", "2");
        url.searchParams.set("c", "3");
        url.searchParams.set("a", "1");

        class CacheKeyWorker extends MiddlewareWorker {
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

        const worker = new CacheKeyWorker(new Request(url));
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
        const key = getVaryKey(request, getVaryHeader(response), new URL(VALID_URL));

        expect(defaultCache.size).toBe(2);

        expect(defaultCache.match(key)).toBeDefined();
    });

    it("does not store vary 'accept-encoding' as a distinct response", async () => {
        const request = new Request(VALID_URL, {
            method: GET,
            headers: { [HttpHeader.ACCEPT_ENCODING]: "gzip, deflate, br" },
        });

        await new TestVaryWorker(request, HttpHeader.ACCEPT_ENCODING).fetch();
        expect(defaultCache.size).toBe(1);
        expect(defaultCache.match(VALID_URL)).toBeDefined();
    });

    it("does not include 'accept-encoding' in the vary cache key", async () => {
        const request = new Request(VALID_URL, {
            method: GET,
            headers: { [HttpHeader.ACCEPT_ENCODING]: "gzip, deflate, br", Origin: VALID_ORIGIN },
        });

        const response = await new TestVaryWorker(
            request,
            `${HttpHeader.ACCEPT_ENCODING}, Origin`,
        ).fetch();

        const key = getVaryKey(request, getVaryHeader(response), new URL(VALID_URL));
        expect(defaultCache.size).toBe(2);
        expect(defaultCache.match(VALID_URL)).toBeDefined();
        expect(defaultCache.match(key)).toBeDefined();

        const decoded = decodeVaryKey(key);
        expect(decoded.url).toBe(VALID_URL);
        expect(decoded.vary).toStrictEqual([["origin", "https://localhost"]]);
    });

    it("retrieves a 'vary aware' response", async () => {
        const request = new Request(VALID_URL, { method: GET, headers: { Origin: VALID_ORIGIN } });
        const main = new Response("main", { headers: { Vary: "Origin" } });
        const vary = new Response("vary", { headers: { Vary: "Origin" } });
        const key = getVaryKey(request, getVaryHeader(main), new URL(VALID_URL));

        defaultCache.put(VALID_URL, main);
        defaultCache.put(key, vary);

        const response = await new TestWorker(request).fetch();
        expect(await response.text()).toBe("vary");
    });

    it("retrieves the unique 'vary aware' response", async () => {
        const request1 = new Request(VALID_URL, { method: GET, headers: { Origin: VALID_ORIGIN } });
        const request2 = new Request(VALID_URL, {
            method: GET,
            headers: { Feature: "Aware" },
        });

        const headers = new Headers({ Vary: "Origin, Feature" });
        const resp = new Response("main", { headers });
        const vary1 = new Response("vary 1", { headers });
        const vary2 = new Response("vary 2", { headers });

        const key1 = getVaryKey(request1, getVaryHeader(vary1), new URL(VALID_URL));
        const key2 = getVaryKey(request2, getVaryHeader(vary2), new URL(VALID_URL));

        defaultCache.put(VALID_URL, resp);
        defaultCache.put(key1, vary1);
        defaultCache.put(key2, vary2);

        const response1 = await new TestWorker(request1).fetch();
        expect(await response1.text()).toBe("vary 1");

        const response2 = await new TestWorker(request2).fetch();
        expect(await response2.text()).toBe("vary 2");
    });

    it("stores a unique 'vary aware' response if not found", async () => {
        const existingRequest = new Request(VALID_URL, {
            method: GET,
            headers: { Origin: VALID_ORIGIN },
        });

        const headers = new Headers({ Vary: "Origin, Feature" });
        const main = new Response("main", { headers });
        const vary = new Response("vary", { headers });

        const key = getVaryKey(existingRequest, getVaryHeader(main), new URL(VALID_URL));
        defaultCache.put(VALID_URL, main);
        defaultCache.put(key, vary);

        const request2 = new Request(VALID_URL, {
            headers: { Origin: "http://foo.bar" },
        });

        let response = await new TestVaryWorker(request2, "Origin, Feature").fetch();
        expect(await response.text()).toBe("from dispatch");
        expect(defaultCache.size).toBe(3);

        const newkey = getVaryKey(request2, getVaryHeader(main), new URL(VALID_URL));
        const cached = defaultCache.match(newkey);
        expect(cached).toBeDefined();

        response = await new TestWorker(existingRequest).fetch();
        expect(await response.text()).toBe("vary");
        expect(defaultCache.size).toBe(3);
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

    describe("sort search params function", () => {
        it("does not modify a url with no search parameters", () => {
            const req = new Request(VALID_URL);
            expect(sortSearchParams(req).toString()).toBe(VALID_URL);
        });

        it("retains the single search parameter in a url", () => {
            const url = `${VALID_URL}?a=1`;
            const req = new Request(url);
            expect(sortSearchParams(req).toString()).toBe(url);
        });

        it("does not modify pre-sorted search parameters", () => {
            const url = `${VALID_URL}?a=1&b=2&c=3`;
            const req = new Request(url);
            expect(sortSearchParams(req).toString()).toBe(url);
        });

        it("sorts the url search parameters", () => {
            const url = `${VALID_URL}?&b=2&c=3&a=1`;
            const req = new Request(url);
            expect(sortSearchParams(req).toString()).toBe(`${VALID_URL}?a=1&b=2&c=3`);
        });

        it("sorts and retains search parameters containing duplicate keys", () => {
            const url = `${VALID_URL}?&b=2&a=4&c=3&a=1`;
            const req = new Request(url);

            // normalizeUrl sorts keys alphabetically, but preserves the order of duplicate keys.
            expect(sortSearchParams(req).toString()).toBe(`${VALID_URL}?a=4&a=1&b=2&c=3`);
        });

        it("ignores the request method and body when generating the key", () => {
            const req = new Request(`${VALID_URL}?z=2&a=1`, {
                method: "POST",
                body: "ignored",
            });
            expect(sortSearchParams(req).toString()).toBe(`${VALID_URL}?a=1&z=2`);
        });

        it("removes the hash if present", () => {
            const req = new Request(`${VALID_URL}?z=2&a=1#section`);
            expect(sortSearchParams(req).toString()).toBe(`${VALID_URL}?a=1&z=2`);
        });
    });

    describe("strip search params function", () => {
        it("removes search parameters from a url", () => {
            const url = `${VALID_URL}?a=1&b=2`;
            const req = new Request(url);
            expect(stripSearchParams(req).toString()).toBe(VALID_URL);
        });

        it("leaves a url without search parameters unchanged", () => {
            const req = new Request(VALID_URL);
            expect(stripSearchParams(req).toString()).toBe(VALID_URL);
        });

        it("removes search params but retains path", () => {
            const url = `${VALID_URL}path/to/resource?a=1&b=2`;
            const req = new Request(url);
            expect(stripSearchParams(req).toString()).toBe(`${VALID_URL}path/to/resource`);
        });

        it("removes search params and hash if present", () => {
            const url = `${VALID_URL}?a=1#section`;
            const req = new Request(url);
            expect(stripSearchParams(req).toString()).toBe(`${VALID_URL}`);
        });
    });
});
