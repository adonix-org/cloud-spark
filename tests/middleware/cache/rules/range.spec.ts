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

import { StatusCodes } from "@src/constants";
import { RangeRule } from "@src/middleware/cache/rules/range";
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as utils from "@src/middleware/cache/rules/utils";

describe("RangeRule", () => {
    let rule: RangeRule;
    let worker: any;
    let next: any;

    beforeEach(() => {
        vi.clearAllMocks();
        rule = new RangeRule();

        worker = {
            request: {
                headers: new Headers(),
                method: "GET",
            },
        };

        next = vi.fn(async () => new Response("ok", { status: StatusCodes.OK }));
    });

    it("returns full response if no Range header", async () => {
        const result = await rule.apply(worker, next);
        expect(result).toBeInstanceOf(Response);
    });

    it("returns undefined for range '0-0'", async () => {
        worker.request.headers.set("Range", "bytes=0-0");
        const result = await rule.apply(worker, next);
        expect(result).toBeUndefined();
    });

    it("returns undefined for range start !== 0 (e.g., 1-5)", async () => {
        worker.request.headers.set("Range", "bytes=1-5");
        const result = await rule.apply(worker, next);
        expect(result).toBeUndefined();
    });

    it("returns response for range with end undefined (e.g., 0-)", async () => {
        worker.request.headers.set("Range", "bytes=0-");
        const result = await rule.apply(worker, next);
        expect(result).toBeInstanceOf(Response);
    });

    it("returns undefined if content-length is missing", async () => {
        worker.request.headers.set("Range", "bytes=0-5");
        vi.spyOn(utils, "getContentLength").mockReturnValue(undefined);
        const result = await rule.apply(worker, next);
        expect(result).toBeUndefined();
    });

    it("returns undefined if range.end !== length - 1", async () => {
        worker.request.headers.set("Range", "bytes=0-4");
        vi.spyOn(utils, "getContentLength").mockReturnValue(6);
        const result = await rule.apply(worker, next);
        expect(result).toBeUndefined();
    });

    it("returns response if range.end === length - 1", async () => {
        worker.request.headers.set("Range", "bytes=0-5");
        vi.spyOn(utils, "getContentLength").mockReturnValue(6);
        const result = await rule.apply(worker, next);
        expect(result).toBeInstanceOf(Response);
    });

    it("returns next() if response is undefined", async () => {
        next = vi.fn(async () => undefined);
        const result = await rule.apply(worker, next);
        expect(result).toBeUndefined();
    });

    it("returns next() if response is non-200", async () => {
        next = vi.fn(async () => new Response("fail", { status: StatusCodes.BAD_REQUEST }));
        const result = await rule.apply(worker, next);
        expect(result).toBeInstanceOf(Response);
    });
});
