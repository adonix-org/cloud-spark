import { expectHeadersEqual, GET_REQUEST, GET_REQUEST_WITH_ORIGIN } from "@common";
import { ctx, defaultCache, namedCache } from "@mock";
import { GET, POST } from "@src/constants/methods";
import { CacheInit } from "@src/interfaces";
import { sortSearchParams } from "@src/middleware";
import { CacheHandler } from "@src/middleware/cache/handler";
import { getVaryKey } from "@src/middleware/cache/utils";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const init: CacheInit = { getKey: sortSearchParams };

class MockWorker {
    constructor(public request: Request) {}
    ctx = ctx;
}

function cacheableResponse(body: string, headers?: HeadersInit): Response {
    return new Response(body, {
        headers: {
            "cache-control": "max-age=60",
            ...headers,
        },
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
            ["internal-variant-set", "accept-language, origin"],
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

        expect(defaultCache.size).toBe(3);
        const cachedVariant = await defaultCache.match(
            getVaryKey(req, ["origin"], new URL(req.url)),
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
            getVaryKey(req, ["origin"], new URL(req.url)),
        );
        expect(await cachedVariant?.text()).toBe("variant");
    });
});
