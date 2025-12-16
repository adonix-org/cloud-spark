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
import {
    found,
    getCacheValidators,
    getContentLength,
    getRange,
    hasCacheValidator,
    isNotModified,
    normalizeEtag,
    toDate,
} from "@src/middleware/cache/rules/utils";
import { describe, expect, it } from "vitest";

describe("rules utils unit tests ", () => {
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

    describe("to date function", () => {
        it("returns undefined for non-string values", () => {
            expect(toDate(undefined)).toBeUndefined();
            expect(toDate(null)).toBeUndefined();
            expect(toDate(12345 as any)).toBeUndefined();
            expect(toDate({} as any)).toBeUndefined();
            expect(toDate([] as any)).toBeUndefined();
        });

        it("returns undefined for clearly invalid date strings", () => {
            expect(toDate("not-a-date")).toBeUndefined();
            expect(toDate("")).toBeUndefined();
        });

        it("returns a number (timestamp) for valid date strings", () => {
            const iso = "2025-10-04T12:34:56Z";
            const result = toDate(iso);
            expect(typeof result).toBe("number");
            expect(result).toBe(Date.parse(iso));

            const rfc1123 = "Wed, 04 Oct 2025 12:34:56 GMT";
            const result2 = toDate(rfc1123);
            expect(typeof result2).toBe("number");
            expect(result2).toBe(Date.parse(rfc1123));
        });

        it("parses RFC 850 format", () => {
            const rfc850 = "Wednesday, 04-Oct-25 12:34:56 GMT";
            const result = toDate(rfc850);
            expect(typeof result).toBe("number");
            expect(result).toBe(Date.parse(rfc850));
        });

        it("parses ANSI C asctime format", () => {
            const asctime = "Wed Oct  4 12:34:56 2025";
            const result = toDate(asctime);
            expect(typeof result).toBe("number");
            expect(result).toBe(Date.parse(asctime));
        });
    });

    describe("normalize etag function", () => {
        it("removes weak prefix W/", () => {
            expect(normalizeEtag('W/"123"')).toBe('"123"');
        });

        it("returns strong etag unchanged", () => {
            expect(normalizeEtag('"abc"')).toBe('"abc"');
        });
    });

    describe("found function", () => {
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

    describe("is not modified function", () => {
        it("returns false if 'if-none-match' is empty", () => {
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

    describe("get cache validators function", () => {
        const makeHeaders = (init: Record<string, string>) => new Headers(init);

        it("returns empty arrays and null if no headers", () => {
            const v = getCacheValidators(makeHeaders({}));
            expect(v.ifMatch).toEqual([]);
            expect(v.ifNoneMatch).toEqual([]);
            expect(v.ifModifiedSince).toBeNull();
            expect(v.ifUnmodifiedSince).toBeNull();
        });

        it("filters out weak etags from 'if-match'", () => {
            const v = getCacheValidators(makeHeaders({ "If-Match": 'W/"123", "456"' }));
            expect(v.ifMatch).toEqual(['"456"']);
        });

        it("normalizes all 'if-none-match' eTags", () => {
            const v = getCacheValidators(makeHeaders({ "If-None-Match": 'W/"123", "456"' }));
            expect(v.ifNoneMatch.sort()).toEqual(['"123"', '"456"'].sort());
        });

        it("returns 'if-modified-since' as string if present", () => {
            const v = getCacheValidators(
                makeHeaders({ "If-Modified-Since": "Mon, 29 Sep 2025 10:00:00 GMT" }),
            );
            expect(v.ifModifiedSince).toBe("Mon, 29 Sep 2025 10:00:00 GMT");
        });

        it("returns 'if-unmodified-since' as string if present", () => {
            const v = getCacheValidators(
                makeHeaders({ "If-Unmodified-Since": "Sat, 04 Oct 2025 12:26:00 GMT" }),
            );
            expect(v.ifUnmodifiedSince).toBe("Sat, 04 Oct 2025 12:26:00 GMT");
        });
    });

    describe("has cache validators function", () => {
        const makeHeaders = (init: Record<string, string>) => new Headers(init);

        it("returns false if no validators", () => {
            expect(hasCacheValidator(makeHeaders({}))).toBe(false);
        });

        it("returns true if 'if-match' present", () => {
            expect(hasCacheValidator(makeHeaders({ "If-Match": '"123"' }))).toBe(true);
        });

        it("returns true if 'if-none-match' present", () => {
            expect(hasCacheValidator(makeHeaders({ "If-None-Match": '"123"' }))).toBe(true);
        });

        it("returns true if 'if-modified-since' present", () => {
            expect(
                hasCacheValidator(makeHeaders({ "If-Modified-Since": "Mon, 29 Sep 2025" })),
            ).toBe(true);
        });
    });

    describe("get content length function", () => {
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

        it("returns undefined for empty 'content-length' header", () => {
            expect(getContentLength(makeHeaders(""))).toBeUndefined();
        });

        it("returns undefined for whitespace-only 'content-length' header", () => {
            expect(getContentLength(makeHeaders("   "))).toBeUndefined();
        });

        it("parses valid 'content-length'", () => {
            expect(getContentLength(makeHeaders("123"))).toBe(123);
        });

        it("returns undefined for non-numeric 'content-length'", () => {
            expect(getContentLength(makeHeaders("abc"))).toBeUndefined();
        });
    });
});
