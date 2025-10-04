import { GET, HEAD, POST } from "@src/constants/methods";
import { MethodRule } from "@src/middleware/cache/rules/method";
import { Head } from "@src/responses";
import { describe, expect, it, vi } from "vitest";

describe("method rule unit tests", () => {
    it("returns next for get requests", async () => {
        const rule = new MethodRule();
        const worker = { request: { method: GET } } as any;

        const resp = new Response("get-response");
        const next = vi.fn(async () => resp);

        const result = await rule.apply(worker, next);
        expect(result).toBe(resp);
        expect(next).toHaveBeenCalledOnce();
    });

    it("wraps response in head for head requests", async () => {
        const rule = new MethodRule();
        const worker = { request: { method: HEAD } } as any;

        const resp = new Response("head-response");
        const next = vi.fn(async () => resp);

        const headSpy = vi.spyOn(Head.prototype, "response");

        const result = await rule.apply(worker, next);
        expect(next).toHaveBeenCalledOnce();
        expect(headSpy).toHaveBeenCalledOnce();
        expect(result).toBeInstanceOf(Response);

        headSpy.mockRestore();
    });

    it("returns undefined for non-get/head methods", async () => {
        const rule = new MethodRule();
        const worker = { request: { method: POST } } as any;

        const next = vi.fn(async () => new Response("should-not-matter"));
        const result = await rule.apply(worker, next);

        expect(result).toBeUndefined();
        expect(next).not.toHaveBeenCalled();
    });

    it("returns undefined for head if next returns undefined", async () => {
        const rule = new MethodRule();
        const worker = { request: { method: HEAD } } as any;

        const next = vi.fn(async () => undefined);
        const headSpy = vi.spyOn(Head.prototype, "response");

        const result = await rule.apply(worker, next);

        expect(result).toBeUndefined();
        expect(headSpy).not.toHaveBeenCalled();

        headSpy.mockRestore();
    });
});
