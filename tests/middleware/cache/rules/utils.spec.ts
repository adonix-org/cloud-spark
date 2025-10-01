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
import { getRange } from "@src/middleware/cache/rules/utils";

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
});
