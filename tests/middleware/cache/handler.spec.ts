import { describe, it, beforeEach, expect } from "vitest";
import { defaultCache, namedCache } from "@mock";
import { CacheHandler } from "@src/middleware/cache/handler";
import { GET, POST } from "@src/constants/methods";
import { getVaryKey, getVaryHeader } from "@src/middleware/cache/utils";
import { sortSearchParams } from "@src/middleware";
import { CacheInit } from "@src/interfaces";

class MockWorker {
    constructor(public request: Request) {}
}

const init: CacheInit = { getKey: sortSearchParams };

describe("cache middleware", () => {
    beforeEach(() => {
        defaultCache.clear();
        namedCache.clear();
    });

    it("returns response from default cache miss", async () => {
        const handler = new CacheHandler(init);
        const req = new Request("https://localhost/", { method: GET });
        const worker = new MockWorker(req);

        const response = new Response("from dispatch");
        await handler.setCached(defaultCache, worker.request, response);

        const cached = await handler.getCached(defaultCache, worker.request);
        expect(await cached?.text()).toBe("from dispatch");
        expect(defaultCache.size).toBe(1);
    });

    it("respects named cache", async () => {
        const handler = new CacheHandler({ name: "named-cache", ...init });
        const req = new Request("https://localhost/", { method: GET });
        const worker = new MockWorker(req);

        const response = new Response("named response");
        await handler.setCached(namedCache, worker.request, response);

        const cached = await handler.getCached(namedCache, worker.request);
        expect(await cached?.text()).toBe("named response");
        expect(namedCache.size).toBe(1);
        expect(defaultCache.size).toBe(0);
    });

    it("does not cache non-GET responses", async () => {
        const handler = new CacheHandler(init);
        const req = new Request("https://localhost/", { method: POST });
        const worker = new MockWorker(req);

        const response = new Response("post response");
        await handler.setCached(defaultCache, worker.request, response);

        const cached = await handler.getCached(defaultCache, worker.request);
        expect(cached).toBeUndefined();
        expect(defaultCache.size).toBe(0);
    });

    it("does not cache responses with no-store or private headers", async () => {
        const handler = new CacheHandler(init);
        const req = new Request("https://localhost/", { method: GET });
        const worker = new MockWorker(req);

        const headers = new Headers({ "cache-control": "no-store, private" });
        const response = new Response("un-cacheable", { headers });

        await handler.setCached(defaultCache, worker.request, response);
        const cached = await handler.getCached(defaultCache, worker.request);

        expect(cached).toBeUndefined();
        expect(defaultCache.size).toBe(0);
    });

    it("stores and returns vary-aware responses", async () => {
        const handler = new CacheHandler(init);
        const req = new Request("https://localhost/", {
            method: GET,
            headers: { Origin: "https://example.com" },
        });
        const worker = new MockWorker(req);

        const response = new Response("from dispatch", { headers: { Vary: "Origin" } });
        await handler.setCached(defaultCache, worker.request, response);

        const key = getVaryKey(
            worker.request,
            getVaryHeader(response),
            new URL(worker.request.url),
        );
        const cached = await defaultCache.match(key);
        expect(cached).toBeDefined();
        expect(await cached?.text()).toBe("from dispatch");
        expect(defaultCache.size).toBe(2);
    });

    it("converts existing non-variant response to variant when new vary appears", async () => {
        const handler = new CacheHandler(init);
        const req = new Request("https://localhost/", {
            method: GET,
            headers: { Origin: "https://example.com" },
        });
        const worker = new MockWorker(req);

        // first response without vary
        await handler.setCached(defaultCache, worker.request, new Response("base"));

        // second response with vary
        const varyResponse = new Response("variant", { headers: { Vary: "Origin" } });
        await handler.setCached(defaultCache, worker.request, varyResponse);

        expect(defaultCache.size).toBe(3); // base + variant placeholder + variant
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

        const response = new Response("variant", { headers: { Vary: "accept-encoding, Origin" } });
        await handler.setCached(defaultCache, worker.request, response);

        expect(defaultCache.size).toBe(2); // base + Origin variant only
        const cachedVariant = await defaultCache.match(
            getVaryKey(req, ["origin"], new URL(req.url)),
        );
        expect(await cachedVariant?.text()).toBe("variant");
    });
});
