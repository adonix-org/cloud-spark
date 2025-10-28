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

import { IfMatchRule, IfNoneMatchRule } from "@src/middleware/cache/rules/etag";
import * as utils from "@src/middleware/cache/rules/utils";
import { beforeEach, describe, expect, it, vi } from "vitest";


describe("etag rule unit tests", () => {
    let response: Response;

    beforeEach(() => {
        response = new Response("ok", { status: 200, headers: { ETag: '"abc123"' } });
    });

    describe("if match rule unit tests", () => {
        let rule: IfMatchRule;

        beforeEach(() => {
            rule = new IfMatchRule();
        });

        it("returns the original response if etag does not fail precondition", async () => {
            vi.spyOn(utils, "isPreconditionFailed").mockReturnValue(false);

            const result = await rule.apply(
                { request: { headers: new Headers() } } as any,
                async () => response,
            );
            expect(result).toBe(response);
        });

        it("returns 412 precondition failed response if etag fails precondition", async () => {
            const fixedEtag = '"abc123"';
            vi.spyOn(utils, "isPreconditionFailed").mockImplementation(
                (_requestHeaders, responseEtag) => {
                    return responseEtag === fixedEtag;
                },
            );

            const result = await rule.apply(
                {
                    request: { headers: new Headers({ "If-Match": fixedEtag }) },
                } as any,
                async () => {
                    const resp = new Response("ok");
                    resp.headers.set("ETag", fixedEtag);
                    return resp;
                },
            );

            expect(result).toBeInstanceOf(Response);
            expect(result?.status).toBe(412);
            expect(await result?.json()).toStrictEqual({
                status: 412,
                error: "Precondition Failed",
                details: 'ETag: "abc123"',
            });
        });
    });

    describe("if none match rule unit tests", () => {
        let rule: IfNoneMatchRule;

        beforeEach(() => {
            rule = new IfNoneMatchRule();
        });

        it("returns original response if if-none-match header is empty", async () => {
            vi.spyOn(utils, "getCacheValidators").mockReturnValue({
                ifNoneMatch: [],
                ifMatch: [],
                ifModifiedSince: null,
                ifUnmodifiedSince: null,
            });

            const result = await rule.apply(
                { request: { headers: new Headers() } } as any,
                async () => response,
            );
            expect(result).toBe(response);
        });

        it("returns 304 not modified if etag is in if-none-match header", async () => {
            vi.spyOn(utils, "getCacheValidators").mockReturnValue({
                ifNoneMatch: ['"abc123"'],
                ifMatch: [],
                ifModifiedSince: null,
                ifUnmodifiedSince: null,
            });
            vi.spyOn(utils, "isNotModified").mockReturnValue(true);

            const result = await rule.apply(
                { request: { headers: new Headers() } } as any,
                async () => response,
            );
            expect(result).toBeInstanceOf(Response);
            expect(result?.status).toBe(304);
        });

        it("returns undefined if etag does not match any in if-none-match header", async () => {
            vi.spyOn(utils, "getCacheValidators").mockReturnValue({
                ifNoneMatch: ['"abc123"'],
                ifMatch: [],
                ifModifiedSince: null,
                ifUnmodifiedSince: null,
            });
            vi.spyOn(utils, "isNotModified").mockReturnValue(false);

            const result = await rule.apply(
                { request: { headers: new Headers() } } as any,
                async () => response,
            );
            expect(result).toBeUndefined();
        });
    });
});
