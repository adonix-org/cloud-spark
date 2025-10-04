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
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as utils from "@src/middleware/cache/rules/utils";

describe("modified cache rules unit tests", () => {
    let response: Response;

    beforeEach(() => {
        response = new Response("ok", { status: 200 });
    });

    describe("modified since rule unit tests", () => {
        let rule: ModifiedSinceRule;

        beforeEach(() => {
            rule = new ModifiedSinceRule();
        });

        it("returns response if no if-modified-since header", async () => {
            vi.spyOn(utils, "toDate").mockReturnValueOnce(undefined);

            const result = await rule.apply(
                { request: { headers: new Headers() } } as any,
                async () => response,
            );
            expect(result).toBe(response);
        });

        it("returns 304 if response is fresh compared to if-modified-since", async () => {
            vi.spyOn(utils, "toDate")
                .mockReturnValueOnce(Date.now()) // response header
                .mockReturnValueOnce(Date.now() + 1000); // request header, slightly ahead

            const result = await rule.apply(
                { request: { headers: new Headers() } } as any,
                async () => response,
            );
            expect(result).toBeInstanceOf(Response);
            expect(result?.status).toBe(304);
        });

        it("returns undefined if response is stale compared to if-modified-since", async () => {
            vi.spyOn(utils, "toDate")
                .mockReturnValueOnce(Date.now() - 1000) // response header, older
                .mockReturnValueOnce(Date.now() - 2000); // request header

            const result = await rule.apply(
                { request: { headers: new Headers() } } as any,
                async () => response,
            );
            expect(result).toBeUndefined();
        });
    });

    describe("unmodified since rule unit tests", () => {
        let rule: UnmodifiedSinceRule;

        beforeEach(() => {
            rule = new UnmodifiedSinceRule();
        });

        it("returns response if no if-unmodified-since header", async () => {
            vi.spyOn(utils, "toDate").mockReturnValueOnce(undefined);

            const result = await rule.apply(
                { request: { headers: new Headers() } } as any,
                async () => response,
            );
            expect(result).toBe(response);
        });

        it("returns 412 if response has been modified since header date", async () => {
            vi.spyOn(utils, "toDate")
                .mockReturnValueOnce(Date.now() + 1000) // response header, newer
                .mockReturnValueOnce(Date.now()); // request header

            const result = await rule.apply(
                { request: { headers: new Headers() } } as any,
                async () => response,
            );
            expect(result).toBeInstanceOf(Response);
            expect(result?.status).toBe(412);
        });

        it("returns response if response is not modified since header date", async () => {
            vi.spyOn(utils, "toDate")
                .mockReturnValueOnce(Date.now() - 1000) // response header, older
                .mockReturnValueOnce(Date.now()); // request header

            const result = await rule.apply(
                { request: { headers: new Headers() } } as any,
                async () => response,
            );
            expect(result).toBe(response);
        });
    });
});
