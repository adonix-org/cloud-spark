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

import { describe, expect, it, vi } from "vitest";
import { decodeVaryKey, expectHeadersEqual, GET_REQUEST, VALID_ORIGIN, VALID_URL } from "@common";
import { ctx, defaultCache, env, namedCache } from "@mock";
import { CacheHandler } from "@src/middleware/cache/handler";
import { MiddlewareWorker } from "@src/workers/middleware";
import { GET, Method } from "@src/constants/methods";
import { getVaryHeader, getVaryKey } from "@src/middleware/cache/utils";
import { HttpHeader } from "@src/constants/headers";
import { StatusCodes } from "http-status-codes";
import { cache } from "@src/middleware/cache/cache";

class TestWorker extends MiddlewareWorker {
    public getAllowedMethods(): Method[] {
        return [GET];
    }

    constructor(request: Request, cacheName?: string) {
        super(request, env, ctx);
        this.use(cache({ name: cacheName }));
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
                    cache({
                        getKey: () => {
                            return new URL(url.pathname, url.origin);
                        },
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
                    cache({
                        getKey: () => {
                            return url;
                        },
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

    it("retuns a 'vary aware' response", async () => {
        const request = new Request(VALID_URL, { method: GET, headers: { Origin: VALID_ORIGIN } });

        await new TestVaryWorker(request, "Origin").fetch();
        const response = await new TestVaryWorker(request, "Origin").fetch();
        const key = getVaryKey(request, getVaryHeader(response), new URL(VALID_URL));

        expect(defaultCache.size).toBe(2);
        expect(defaultCache.match(key)).toBeDefined();
        expectHeadersEqual(response.headers, [
            ["content-type", "text/plain;charset=UTF-8"],
            ["vary", "Origin"],
        ]);
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

    it("does not cache 'un-cacheable' responses", async () => {
        class BadResponseWorker extends TestWorker {
            protected async dispatch(): Promise<Response> {
                return new Response("do not cache", { status: StatusCodes.PARTIAL_CONTENT });
            }
        }

        const response = await new BadResponseWorker(GET_REQUEST).fetch();
        expect(response.status).toBe(206);
        expect(defaultCache.size).toBe(0);
        expect(namedCache.size).toBe(0);
    });

    it("does not cache 'un-cacheable' responses", async () => {
        class BadResponseWorker extends TestWorker {
            protected async dispatch(): Promise<Response> {
                return new Response("do not cache", { status: StatusCodes.PARTIAL_CONTENT });
            }
        }

        const response = await new BadResponseWorker(GET_REQUEST).fetch();
        expect(response.status).toBe(206);
        expect(defaultCache.size).toBe(0);
        expect(namedCache.size).toBe(0);
    });

    it("returns a response variant for vary cache", async () => {
        const request = new Request(VALID_URL, {
            method: GET,
            headers: { [HttpHeader.ORIGIN]: VALID_ORIGIN },
        });

        await new TestVaryWorker(request, HttpHeader.ORIGIN).fetch();
        const variant = defaultCache.match(VALID_URL);
        expect(defaultCache.size).toBe(2);
        expectHeadersEqual(variant!.headers, [["internal-variant-set", "origin"]]);

        const text = await variant?.text();
        expect(text).toBe("");
    });

    it("converts a non-variant response to a variant enabled cache entry", async () => {
        vi.spyOn(CacheHandler.prototype, "getCached").mockResolvedValue(undefined);

        const request = new Request(VALID_URL, {
            method: GET,
            headers: { [HttpHeader.ORIGIN]: VALID_ORIGIN },
        });

        await new TestVaryWorker(request, "").fetch();

        const response = defaultCache.match(VALID_URL);
        expect(defaultCache.size).toBe(1);
        expectHeadersEqual(response!.headers, [
            ["content-type", "text/plain;charset=UTF-8"],
            ["vary", ""],
        ]);

        await new TestVaryWorker(request, "Origin").fetch();
        const responses = defaultCache.matchAll();
        expectHeadersEqual(responses[0]!.headers, [["internal-variant-set", "origin"]]);
        expect(await responses[0]!.text()).toBe("");
        expectHeadersEqual(responses[1]!.headers, [
            ["content-type", "text/plain;charset=UTF-8"],
            ["vary", "Origin"],
        ]);
        expectHeadersEqual(responses[2]!.headers, [
            ["content-type", "text/plain;charset=UTF-8"],
            ["vary", ""],
        ]);
    });

    it("extends an existing variant response with new vary headers", async () => {
        vi.spyOn(CacheHandler.prototype, "getCached").mockResolvedValue(undefined);

        const request = new Request(VALID_URL, {
            method: GET,
            headers: { [HttpHeader.ORIGIN]: VALID_ORIGIN, "X-Vary-Header-1": "on" },
        });

        await new TestVaryWorker(request, "Origin").fetch();

        const response = defaultCache.match(VALID_URL);
        expect(defaultCache.size).toBe(2);
        expectHeadersEqual(response!.headers, [["internal-variant-set", "origin"]]);

        await new TestVaryWorker(request, "Origin, X-Vary-Header-1").fetch();
        const responses = defaultCache.matchAll();
        expect(responses.length).toBe(3);
        expectHeadersEqual(responses[0]!.headers, [
            ["internal-variant-set", "origin, x-vary-header-1"],
        ]);
        expect(await responses[0]!.text()).toBe("");
        expectHeadersEqual(responses[1]!.headers, [
            ["content-type", "text/plain;charset=UTF-8"],
            ["vary", "Origin"],
        ]);
        expectHeadersEqual(responses[2]!.headers, [
            ["content-type", "text/plain;charset=UTF-8"],
            ["vary", "Origin, X-Vary-Header-1"],
        ]);
    });

    it("does not modify the existing variant response if not needed", async () => {
        vi.spyOn(CacheHandler.prototype, "getCached").mockResolvedValue(undefined);

        const request = new Request(VALID_URL, {
            method: GET,
            headers: { [HttpHeader.ORIGIN]: VALID_ORIGIN, "X-Vary-Header-1": "on" },
        });

        await new TestVaryWorker(request, "Origin").fetch();

        const response = defaultCache.match(VALID_URL);
        expect(defaultCache.size).toBe(2);
        expectHeadersEqual(response!.headers, [["internal-variant-set", "origin"]]);

        await new TestVaryWorker(request, "Origin, X-Vary-Header-1").fetch();
        const responses = defaultCache.matchAll();
        expect(responses.length).toBe(3);
        expectHeadersEqual(responses[0]!.headers, [
            ["internal-variant-set", "origin, x-vary-header-1"],
        ]);
        expect(await responses[0]!.text()).toBe("");
        expectHeadersEqual(responses[1]!.headers, [
            ["content-type", "text/plain;charset=UTF-8"],
            ["vary", "Origin"],
        ]);
        expectHeadersEqual(responses[2]!.headers, [
            ["content-type", "text/plain;charset=UTF-8"],
            ["vary", "Origin, X-Vary-Header-1"],
        ]);
    });
});
