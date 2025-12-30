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

import { expectHeadersEqual, GET_REQUEST, GET_REQUEST_WITH_ORIGIN } from "@common";
import { ctx, defaultCache, namedCache } from "@mock";
import { GET, POST } from "@src/constants/methods";
import { CacheInit } from "@src/middleware/cache/interfaces";
import { sortSearchParams } from "@src/middleware";
import { CacheHandler } from "@src/middleware/cache/handler";
import { getVaryKey } from "@src/middleware/cache/utils";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { StatusCodes } from "@src/constants";
import { HttpHeader } from "@src/constants/headers";

const init: CacheInit = { getKey: sortSearchParams };

class MockWorker {
    constructor(public request: Request) {}
    ctx = ctx;
}

function cacheableResponse(
    body: string,
    headers?: HeadersInit,
    status: number = StatusCodes.OK,
): Response {
    return new Response(body, {
        headers: {
            "cache-control": "max-age=60",
            ...headers,
        },
        status,
    });
}

describe("cache middleware unit tests", () => {
    beforeEach(() => {
        defaultCache.clear();
        namedCache.clear();
    });

    afterEach(async () => {
        await ctx.flush();
    });

    it("returns fresh response when cache is empty", async () => {
        const handler = new CacheHandler(init);
        const worker = new MockWorker(GET_REQUEST);
        const res = await handler.handle(worker as any, async () =>
            cacheableResponse("fresh-response"),
        );
        await ctx.flush();

        expect(await res.text()).toBe("fresh-response");
        expect(defaultCache.size).toBe(1);
    });

    it("returns cached response if present", async () => {
        await defaultCache.put("https://localhost/", cacheableResponse("cached-response"));
        const handler = new CacheHandler(init);
        const worker = new MockWorker(GET_REQUEST);
        const res = await handler.handle(worker as any, async () =>
            cacheableResponse("fresh-response"),
        );
        await ctx.flush();

        expect(await res.text()).toBe("cached-response");
        expect(defaultCache.size).toBe(1);
    });

    it("returns cached response if present in named cache", async () => {
        await namedCache.put("https://localhost/", cacheableResponse("cached-response"));
        const handler = new CacheHandler({ ...init, name: "named-cache" });
        const worker = new MockWorker(GET_REQUEST);
        const res = await handler.handle(worker as any, async () =>
            cacheableResponse("fresh-response"),
        );
        await ctx.flush();

        expect(await res.text()).toBe("cached-response");
        expect(namedCache.size).toBe(1);
    });

    it("overwrites cached response if present", async () => {
        await defaultCache.put("https://localhost/", cacheableResponse("cached-response"));
        const handler = new CacheHandler(init);
        const worker = new MockWorker(GET_REQUEST);

        const update = cacheableResponse("overwrite-response");
        await handler.setCached(defaultCache, worker.request, update);

        expect(defaultCache.size).toBe(1);
        const cached = defaultCache.matchAll()[0];
        expect(await cached.text()).toBe("overwrite-response");
    });

    it("returns response from default cache miss", async () => {
        const handler = new CacheHandler(init);
        const worker = new MockWorker(GET_REQUEST);

        const response = cacheableResponse("from dispatch");
        await handler.setCached(defaultCache, worker.request, response);

        const cached = await handler.getCached(defaultCache, worker.request);
        expect(await cached?.text()).toBe("from dispatch");
        expect(defaultCache.size).toBe(1);
    });

    it("respects named cache", async () => {
        const handler = new CacheHandler({ name: "named-cache", ...init });
        const worker = new MockWorker(GET_REQUEST);

        const response = cacheableResponse("named response");
        await handler.setCached(namedCache, worker.request, response);

        const cached = await handler.getCached(namedCache, worker.request);
        expect(await cached?.text()).toBe("named response");
        expect(namedCache.size).toBe(1);
        expect(defaultCache.size).toBe(0);
    });

    it("adds debug headers to the non-variant response when enabled", async () => {
        const handler = new CacheHandler({ debug: true, ...init });
        const worker = new MockWorker(GET_REQUEST);

        const response = cacheableResponse("debug response", { range: "bytes=0-1" });
        await handler.setCached(defaultCache, worker.request, response);

        const cached = await handler.getCached(defaultCache, worker.request);
        expect(await cached?.text()).toBe("debug response");
        expectHeadersEqual(cached!.headers, [
            ["cache-control", "max-age=60"],
            ["content-type", "text/plain;charset=UTF-8"],
            ["cs-cache-key", "https://localhost/"],
            ["cs-cache-req-headers", "none"],
            ["range", "bytes=0-1"],
        ]);
    });

    it("adds debug headers to the variant response when enabled", async () => {
        const handler = new CacheHandler({ debug: true, ...init });
        const worker = new MockWorker(GET_REQUEST_WITH_ORIGIN);

        const response = cacheableResponse("debug response", {
            Vary: "Origin",
            "If-None-Match": '"abc123"',
        });
        await handler.setCached(defaultCache, worker.request, response);

        const cached = await handler.getCached(defaultCache, worker.request);
        expect(await cached?.text()).toBe("debug response");
        expectHeadersEqual(cached!.headers, [
            ["cache-control", "max-age=60"],
            ["content-type", "text/plain;charset=UTF-8"],
            ["cs-cache-decoded-key", '["https://localhost/",[["origin","https://localhost"]]]'],
            [
                "cs-cache-key",
                "https://vary/WyJodHRwczovL2xvY2FsaG9zdC8iLFtbIm9yaWdpbiIsImh0dHBzOi8vbG9jYWxob3N0Il1dXQ",
            ],
            ["cs-cache-req-headers", "none"],
            ["if-none-match", '"abc123"'],
            ["vary", "Origin"],
        ]);
    });

    it("does not cache non-get responses", async () => {
        const handler = new CacheHandler(init);
        const req = new Request("https://localhost/", { method: POST });
        const worker = new MockWorker(req);

        const response = cacheableResponse("post response");
        await handler.setCached(defaultCache, worker.request, response);

        const cached = await handler.getCached(defaultCache, worker.request);
        expect(cached).toBeUndefined();
        expect(defaultCache.size).toBe(0);
    });

    it("does not cache responses with no-store or private headers", async () => {
        const handler = new CacheHandler(init);
        const worker = new MockWorker(GET_REQUEST);

        const headers = new Headers({ "cache-control": "no-store, private" });
        const response = new Response("un-cacheable", { headers });

        await handler.setCached(defaultCache, worker.request, response);
        const cached = await handler.getCached(defaultCache, worker.request);

        expect(cached).toBeUndefined();
        expect(defaultCache.size).toBe(0);
    });

    it("stores and returns vary-aware responses", async () => {
        const handler = new CacheHandler(init);
        const worker = new MockWorker(GET_REQUEST_WITH_ORIGIN);

        const response = cacheableResponse("from dispatch", { Vary: "Origin" });
        await handler.setCached(defaultCache, worker.request, response);

        const cached = await handler.getCached(defaultCache, worker.request);
        expect(cached).toBeDefined();
        expect(await cached?.text()).toBe("from dispatch");
        expect(defaultCache.size).toBe(2);
    });

    it("updates and stores the variant response", async () => {
        const handler = new CacheHandler(init);
        const worker = new MockWorker(GET_REQUEST_WITH_ORIGIN);

        const response = cacheableResponse("from dispatch", { Vary: "Origin" });
        await handler.setCached(defaultCache, worker.request, response);

        const update = cacheableResponse("from dispatch", { Vary: "Origin, Accept-Language" });
        await handler.setCached(defaultCache, worker.request, update);
        expect(defaultCache.size).toBe(2);

        const responses = defaultCache.matchAll();
        expectHeadersEqual(responses[0].headers, [
            ["cache-control", "s-maxage=60"],
            [HttpHeader.INTERNAL_VARIANT_SET, "accept-language, origin"],
        ]);
    });

    it("skips updating the variant response if no vary in response", async () => {
        const handler = new CacheHandler(init);
        const worker = new MockWorker(GET_REQUEST_WITH_ORIGIN);

        const response = cacheableResponse("from dispatch", { Vary: "Origin" });
        await handler.setCached(defaultCache, worker.request, response);

        const update = cacheableResponse("from dispatch");
        await handler.setCached(defaultCache, new Request(GET_REQUEST), update);
        expect(defaultCache.size).toBe(3);

        const responses = defaultCache.matchAll();
        expectHeadersEqual(responses[0].headers, [
            ["cache-control", "s-maxage=60"],
            [HttpHeader.INTERNAL_VARIANT_SET, "origin"],
        ]);
    });

    it("skips updating the variant response if same vary in response", async () => {
        const handler = new CacheHandler(init);
        const worker = new MockWorker(GET_REQUEST_WITH_ORIGIN);

        const response = cacheableResponse("from dispatch", { Vary: "Origin" });
        await handler.setCached(defaultCache, worker.request, response);

        const update = cacheableResponse("from dispatch", { Vary: "Origin" });
        await handler.setCached(defaultCache, new Request(GET_REQUEST), update);
        expect(defaultCache.size).toBe(3);

        const responses = defaultCache.matchAll();
        expectHeadersEqual(responses[0].headers, [
            ["cache-control", "s-maxage=60"],
            [HttpHeader.INTERNAL_VARIANT_SET, "origin"],
        ]);
    });

    it("skips updating the variant response if vary contains header to ignore", async () => {
        const handler = new CacheHandler(init);
        const worker = new MockWorker(GET_REQUEST_WITH_ORIGIN);

        const response = cacheableResponse("from dispatch", { Vary: "Origin" });
        await handler.setCached(defaultCache, worker.request, response);

        const update = cacheableResponse("from dispatch", { Vary: "Origin, Accept-Encoding" });
        await handler.setCached(defaultCache, new Request(GET_REQUEST), update);
        expect(defaultCache.size).toBe(3);

        const responses = defaultCache.matchAll();
        expectHeadersEqual(responses[0].headers, [
            ["cache-control", "s-maxage=60"],
            [HttpHeader.INTERNAL_VARIANT_SET, "origin"],
        ]);
    });

    it("converts existing non-variant response to variant when new vary appears", async () => {
        const handler = new CacheHandler(init);
        const req = new Request("https://localhost/", {
            method: GET,
            headers: { Origin: "https://example.com" },
        });
        const worker = new MockWorker(req);

        await handler.setCached(defaultCache, worker.request, cacheableResponse("base"));

        const varyResponse = cacheableResponse("variant", { Vary: "Origin" });
        await handler.setCached(defaultCache, worker.request, varyResponse);

        expect(defaultCache.size).toBe(2);
        const cachedVariant = await defaultCache.match(
            getVaryKey(req.headers, new URL(req.url), ["origin"]),
        );
        expect(await cachedVariant?.text()).toBe("variant");
    });

    it("ignores accept-encoding in vary headers", async () => {
        const handler = new CacheHandler(init);
        const req = new Request("https://localhost/", {
            method: GET,
            headers: { "accept-encoding": "gzip", Origin: "https://example.com" },
        });
        const worker = new MockWorker(req);

        const response = cacheableResponse("variant", { Vary: "accept-encoding, Origin" });
        await handler.setCached(defaultCache, worker.request, response);

        expect(defaultCache.size).toBe(2);
        const cachedVariant = await defaultCache.match(
            getVaryKey(req.headers, new URL(req.url), ["origin"]),
        );
        expect(await cachedVariant?.text()).toBe("variant");
    });

    it("returns non-variant response when range is present", async () => {
        const handler = new CacheHandler(init);

        const req = new Request("https://localhost/", {
            headers: {
                Range: "bytes=0-1",
            },
        });
        const response = cacheableResponse("plain");

        await handler.setCached(defaultCache, req, response);

        const result = await handler.getCached(defaultCache, req);

        expect(result).toBeDefined();
        expect(await result!.text()).toBe("plain");
        expect(defaultCache.size).toBe(1);
    });

    it("returns variant response when range is present", async () => {
        const handler = new CacheHandler(init);

        const req = new Request("https://localhost/", {
            headers: {
                Range: "bytes=0-1",
            },
        });
        const response = cacheableResponse("plain", { Vary: "Origin" });

        await handler.setCached(defaultCache, req, response);

        const result = await handler.getCached(defaultCache, req);

        expect(result).toBeDefined();
        expect(await result!.text()).toBe("plain");
        expect(defaultCache.size).toBe(2);
    });

    it("returns not-modified response for non-variants", async () => {
        const handler = new CacheHandler(init);

        const req = new Request("https://localhost/");
        const response = new Response(null, { status: 304 });

        defaultCache.put(req.url, response);

        const result = await handler.getCached(defaultCache, req);

        expect(result).toBeDefined();
        expect(result?.status).toBe(304);
        expect(defaultCache.size).toBe(1);
    });
});
