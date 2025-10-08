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

import { ModifiedSinceRule, UnmodifiedSinceRule } from "@src/middleware/cache/rules/modified";
import { beforeEach, describe, expect, it } from "vitest";
import { StatusCodes } from "@src/constants";

describe("Last-Modified-based cache validation rules", () => {
    let response: Response;

    beforeEach(() => {
        response = new Response("ok", {
            status: 200,
            headers: { "Last-Modified": new Date("2025-10-05T12:41:17Z").toUTCString() },
        });
    });

    describe("modified since rule unit tests", () => {
        let rule: ModifiedSinceRule;

        beforeEach(() => {
            rule = new ModifiedSinceRule();
        });

        it("returns response if no if-modified-since header", async () => {
            const worker = { request: new Request("https://x", { headers: {} }) } as any;
            const result = await rule.apply(worker, async () => response);
            expect(result).toBe(response);
        });

        it("returns 304 if response not newer than if-modified-since", async () => {
            const since = new Date("2025-10-05T12:42:17Z").toUTCString();
            const worker = {
                request: new Request("https://x", { headers: { "If-Modified-Since": since } }),
            } as any;

            const result = await rule.apply(worker, async () => response);
            expect(result?.status).toBe(StatusCodes.NOT_MODIFIED);
        });

        it("returns undefined if response is newer than if-modified-since", async () => {
            const since = new Date("2025-10-05T12:40:17Z").toUTCString();
            const worker = {
                request: new Request("https://x", { headers: { "If-Modified-Since": since } }),
            } as any;

            const result = await rule.apply(worker, async () => response);
            expect(result).toBeUndefined();
        });
    });

    describe("UnmodifiedSinceRule", () => {
        let rule: UnmodifiedSinceRule;

        beforeEach(() => {
            rule = new UnmodifiedSinceRule();
        });

        it("returns response if no if-unmodified-since header", async () => {
            const worker = { request: new Request("https://x", { headers: {} }) } as any;
            const result = await rule.apply(worker, async () => response);
            expect(result).toBe(response);
        });

        it("returns 412 if response newer than if-unmodified-since", async () => {
            const since = new Date("2025-10-05T12:40:17Z").toUTCString(); // earlier
            const worker = {
                request: new Request("https://x", { headers: { "If-Unmodified-Since": since } }),
            } as any;

            const result = await rule.apply(worker, async () => response);
            expect(result?.status).toBe(StatusCodes.PRECONDITION_FAILED);
            const json = await result!.json();
            expect(json).toStrictEqual({
                details: "Last-Modified: Sun, 05 Oct 2025 12:41:17 GMT",
                error: "Precondition Failed",
                status: 412,
            });
        });

        it("returns response if response older than if-unmodified-since", async () => {
            const since = new Date("2025-10-05T12:42:17Z").toUTCString();
            const worker = {
                request: new Request("https://x", { headers: { "If-Unmodified-Since": since } }),
            } as any;

            const result = await rule.apply(worker, async () => response);
            expect(result).toBe(response);
        });
    });
});
