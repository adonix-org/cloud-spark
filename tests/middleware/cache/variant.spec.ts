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

import { VariantResponse } from "@src/middleware/cache/variant";
import { describe, expect, it } from "vitest";

describe("variant response unit tests", () => {
    describe("new and constructor", () => {
        it("throws if created with empty vary", () => {
            expect(() => VariantResponse.new([])).toThrow(
                "Cannot create a variant response with no vary elements.",
            );
        });

        it("creates a variant with given vary headers", () => {
            const v = VariantResponse.new(["Origin", "Accept-Language"]);
            expect(v.vary).toEqual(["Accept-Language", "Origin"]);
        });
    });

    describe("restore", () => {
        it("restores a variant from a Response", async () => {
            const original = VariantResponse.new(["Origin"]);
            const restored = VariantResponse.restore(await original.response());
            expect(restored.vary).toEqual(["Origin"]);
        });

        it("throws if source is not a variant response", () => {
            const nonVariant = new Response("ok");
            expect(() => VariantResponse.restore(nonVariant)).toThrow(
                "The source response is not a variant response",
            );
        });

        it("restores the variant from a response with cache control", async () => {
            const original = VariantResponse.new(["Origin"]);
            original.cache = { "s-maxage": 100 };
            const restored = VariantResponse.restore(await original.response());
            expect(restored.cache).toStrictEqual({ "s-maxage": 100 });
        });
    });

    describe("append", () => {
        it("adds new vary headers and marks modified", () => {
            const v = VariantResponse.new(["Origin"]);
            expect(v.isModified).toBe(false);
            v.append(["Accept-Language"]);
            expect(v.vary).toEqual(["Accept-Language", "Origin"]);
            expect(v.isModified).toBe(true);
        });

        it("does not mark modified if headers are duplicates", () => {
            const v = VariantResponse.new(["Origin"]);
            v.append(["Origin"]);
            expect(v.vary).toEqual(["Origin"]);
            expect(v.isModified).toBe(false);
        });
    });

    describe("isVariantResponse", () => {
        it("returns true for a variant response", async () => {
            const v = VariantResponse.new(["Origin"]);
            expect(VariantResponse.isVariantResponse(await v.response())).toBe(true);
        });

        it("returns false for a normal Response", () => {
            const r = new Response("ok");
            expect(VariantResponse.isVariantResponse(r)).toBe(false);
        });
    });

    describe("expireAfter", () => {
        it("sets TTL when none exists", () => {
            const v = VariantResponse.new(["Origin"]);
            const r = new Response("ok", {
                headers: { "Cache-Control": "s-maxage=60" },
            });
            v.expireAfter(r);
            expect(v.cache?.["s-maxage"]).toBe(60);
            expect(v.isModified).toBe(true);
        });

        it("updates TTL if incoming is larger", () => {
            const v = VariantResponse.new(["Origin"]);
            v.cache = { "s-maxage": 60 };
            const r = new Response("ok", {
                headers: { "Cache-Control": "s-maxage=120" },
            });
            v.expireAfter(r);
            expect(v.cache?.["s-maxage"]).toBe(120);
            expect(v.isModified).toBe(true);
        });

        it("does not update TTL if incoming is smaller", () => {
            const v = VariantResponse.new(["Origin"]);
            v.cache = { "s-maxage": 120 };
            const r = new Response("ok", {
                headers: { "Cache-Control": "s-maxage=60" },
            });
            v.expireAfter(r);
            expect(v.cache?.["s-maxage"]).toBe(120);
            expect(v.isModified).toBe(false);
        });

        it("does nothing if Cache-Control has no TTL", () => {
            const v = VariantResponse.new(["Origin"]);
            const r = new Response("ok", {
                headers: { "Cache-Control": "no-cache" },
            });
            v.expireAfter(r);
            expect(v.cache).toBeUndefined();
            expect(v.isModified).toBe(false);
        });

        it("uses max-age if s-maxage is missing", () => {
            const v = VariantResponse.new(["Origin"]);
            const r = new Response("ok", {
                headers: { "Cache-Control": "max-age=30" },
            });
            v.expireAfter(r);
            expect(v.cache?.["s-maxage"]).toBe(30);
            expect(v.isModified).toBe(true);
        });

        it("ignores Response without Cache-Control header", () => {
            const v = VariantResponse.new(["Origin"]);
            const r = new Response("ok");
            v.expireAfter(r);
            expect(v.cache).toBeUndefined();
            expect(v.isModified).toBe(false);
        });
    });
});
