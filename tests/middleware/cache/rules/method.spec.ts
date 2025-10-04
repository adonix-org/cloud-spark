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
