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

import { VALID_URL } from "@common";
import { describe, expect, it } from "vitest";
import {
    found,
    getCacheValidators,
    getContentLength,
    getEtag,
    getRange,
    hasCacheValidator,
    isNotModified,
    isPreconditionFailed,
    normalizeEtag,
} from "@src/middleware/cache/rules/utils";

describe("rules/cache utils unit tests ", () => {
    describe("get range function", () => {
        const makeRequest = (range?: string): Request =>
            new Request(VALID_URL, {
                headers: range ? { Range: range } : {},
            });

        it("returns undefined if no Range header", () => {
            expect(getRange(makeRequest())).toBeUndefined();
        });

        it("parses simple range bytes=0-99", () => {
            expect(getRange(makeRequest("bytes=0-99"))).toEqual({ start: 0, end: 99 });
        });

        it("parses open-ended range bytes=0-", () => {
            expect(getRange(makeRequest("bytes=0-"))).toEqual({ start: 0 });
        });

        it("parses larger numbers correctly", () => {
            expect(getRange(makeRequest("bytes=12345-67890"))).toEqual({
                start: 12345,
                end: 67890,
            });
        });

        it("returns undefined for bytes=-500 (suffix range)", () => {
            expect(getRange(makeRequest("bytes=-500"))).toBeUndefined();
        });

        it("returns undefined for malformed headers", () => {
            expect(getRange(makeRequest("bytes=abc-def"))).toBeUndefined();
            expect(getRange(makeRequest("bytes=--"))).toBeUndefined();
            expect(getRange(makeRequest("bytes=123"))).toBeUndefined();
            expect(getRange(makeRequest("bytes=123-abc"))).toBeUndefined();
            expect(getRange(makeRequest("foobar"))).toBeUndefined();
        });

        it("handles bytes=0-0 correctly", () => {
            expect(getRange(makeRequest("bytes=0-0"))).toEqual({ start: 0, end: 0 });
        });

        it("handles max 12-digit numbers", () => {
            expect(getRange(makeRequest("bytes=123456789012-123456789012"))).toEqual({
                start: 123456789012,
                end: 123456789012,
            });
        });

        it("rejects ranges with more than 12 digits", () => {
            expect(getRange(makeRequest("bytes=1234567890123-1234567890123"))).toBeUndefined();
        });
    });

    describe("getEtag", () => {
        const makeResponse = (etag?: string) =>
            new Response("ok", {
                headers: etag ? { ETag: etag } : {},
            });

        it("returns undefined if no ETag header", () => {
            expect(getEtag(makeResponse())).toBeUndefined();
        });

        it("returns the ETag if present", () => {
            expect(getEtag(makeResponse('"abc123"'))).toBe('"abc123"');
        });
    });

    describe("normalizeEtag", () => {
        it("removes weak prefix W/", () => {
            expect(normalizeEtag('W/"123"')).toBe('"123"');
        });

        it("returns strong ETag unchanged", () => {
            expect(normalizeEtag('"abc"')).toBe('"abc"');
        });
    });

    describe("found", () => {
        it("returns true if array contains search value", () => {
            expect(found(["a", "b", "c"], "b")).toBe(true);
        });

        it("returns false if array does not contain search value", () => {
            expect(found(["a", "b", "c"], "x")).toBe(false);
        });

        it("returns true if any search term matches", () => {
            expect(found(["a", "b", "c"], "x", "b", "z")).toBe(true);
        });
    });

    describe("isPreconditionFailed", () => {
        it("returns false if ifMatch is empty", () => {
            expect(isPreconditionFailed([], '"abc"')).toBe(false);
        });

        it("returns false if ETag matches one of the values", () => {
            expect(isPreconditionFailed(['"abc"'], '"abc"')).toBe(false);
        });

        it("returns false if wildcard is present", () => {
            expect(isPreconditionFailed(["*"], '"abc"')).toBe(false);
        });

        it("returns true if no match and no wildcard", () => {
            expect(isPreconditionFailed(['"def"'], '"abc"')).toBe(true);
        });
    });

    describe("isNotModified", () => {
        it("returns false if ifNoneMatch is empty", () => {
            expect(isNotModified([], '"abc"')).toBe(false);
        });

        it("returns true if value matches after normalization", () => {
            expect(isNotModified(['"123"'], 'W/"123"')).toBe(true);
        });

        it("returns true if wildcard is present", () => {
            expect(isNotModified(["*"], '"xyz"')).toBe(true);
        });

        it("returns false if no match and no wildcard", () => {
            expect(isNotModified(['"def"'], '"abc"')).toBe(false);
        });
    });

    describe("getCacheValidators", () => {
        const makeHeaders = (init: Record<string, string>) => new Headers(init);

        it("returns empty arrays and null if no headers", () => {
            const v = getCacheValidators(makeHeaders({}));
            expect(v.ifMatch).toEqual([]);
            expect(v.ifNoneMatch).toEqual([]);
            expect(v.ifModifiedSince).toBeNull();
        });

        it("filters out weak ETags from If-Match", () => {
            const v = getCacheValidators(makeHeaders({ "If-Match": 'W/"123", "456"' }));
            expect(v.ifMatch).toEqual(['"456"']);
        });

        it("normalizes all If-None-Match ETags", () => {
            const v = getCacheValidators(makeHeaders({ "If-None-Match": 'W/"123", "456"' }));
            expect(v.ifNoneMatch.sort()).toEqual(['"123"', '"456"'].sort());
        });

        it("returns If-Modified-Since as string if present", () => {
            const v = getCacheValidators(
                makeHeaders({ "If-Modified-Since": "Mon, 29 Sep 2025 10:00:00 GMT" }),
            );
            expect(v.ifModifiedSince).toBe("Mon, 29 Sep 2025 10:00:00 GMT");
        });
    });

    describe("hasCacheValidator", () => {
        const makeHeaders = (init: Record<string, string>) => new Headers(init);

        it("returns false if no validators", () => {
            expect(hasCacheValidator(makeHeaders({}))).toBe(false);
        });

        it("returns true if If-Match present", () => {
            expect(hasCacheValidator(makeHeaders({ "If-Match": '"123"' }))).toBe(true);
        });

        it("returns true if If-None-Match present", () => {
            expect(hasCacheValidator(makeHeaders({ "If-None-Match": '"123"' }))).toBe(true);
        });

        it("returns true if If-Modified-Since present", () => {
            expect(
                hasCacheValidator(makeHeaders({ "If-Modified-Since": "Mon, 29 Sep 2025" })),
            ).toBe(true);
        });
    });

    describe("getContentLength", () => {
        const makeHeaders = (contentLength?: string) => {
            const h = new Headers();
            if (contentLength !== undefined) {
                h.set("Content-Length", contentLength);
            }
            return h;
        };

        it("returns undefined for missing Content-Length header", () => {
            expect(getContentLength(makeHeaders())).toBeUndefined();
        });

        it("returns undefined for empty Content-Length header", () => {
            expect(getContentLength(makeHeaders(""))).toBeUndefined();
        });

        it("returns undefined for whitespace-only Content-Length header", () => {
            expect(getContentLength(makeHeaders("   "))).toBeUndefined();
        });

        it("parses valid Content-Length", () => {
            expect(getContentLength(makeHeaders("123"))).toBe(123);
        });

        it("returns undefined for non-numeric Content-Length", () => {
            expect(getContentLength(makeHeaders("abc"))).toBeUndefined();
        });
    });
});
