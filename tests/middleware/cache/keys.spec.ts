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
import { sortSearchParams, stripSearchParams } from "@src/middleware/cache/keys";
import { describe, expect, it } from "vitest";

describe("cache keys unit tests", () => {
    describe("sort search params function", () => {
        it("does not modify a url with no search parameters", () => {
            const req = new Request(VALID_URL);
            expect(sortSearchParams(req).toString()).toBe(VALID_URL);
        });

        it("retains the single search parameter in a url", () => {
            const url = `${VALID_URL}?a=1`;
            const req = new Request(url);
            expect(sortSearchParams(req).toString()).toBe(url);
        });

        it("does not modify pre-sorted search parameters", () => {
            const url = `${VALID_URL}?a=1&b=2&c=3`;
            const req = new Request(url);
            expect(sortSearchParams(req).toString()).toBe(url);
        });

        it("sorts the url search parameters", () => {
            const url = `${VALID_URL}?&b=2&c=3&a=1`;
            const req = new Request(url);
            expect(sortSearchParams(req).toString()).toBe(`${VALID_URL}?a=1&b=2&c=3`);
        });

        it("sorts and retains search parameters containing duplicate keys", () => {
            const url = `${VALID_URL}?&b=2&a=4&c=3&a=1`;
            const req = new Request(url);

            // normalizeUrl sorts keys alphabetically, but preserves the order of duplicate keys.
            expect(sortSearchParams(req).toString()).toBe(`${VALID_URL}?a=4&a=1&b=2&c=3`);
        });

        it("ignores the request method and body when generating the key", () => {
            const req = new Request(`${VALID_URL}?z=2&a=1`, {
                method: "POST",
                body: "ignored",
            });
            expect(sortSearchParams(req).toString()).toBe(`${VALID_URL}?a=1&z=2`);
        });

        it("removes the hash if present", () => {
            const req = new Request(`${VALID_URL}?z=2&a=1#section`);
            expect(sortSearchParams(req).toString()).toBe(`${VALID_URL}?a=1&z=2`);
        });
    });

    describe("strip search params function", () => {
        it("removes search parameters from a url", () => {
            const url = `${VALID_URL}?a=1&b=2`;
            const req = new Request(url);
            expect(stripSearchParams(req).toString()).toBe(VALID_URL);
        });

        it("leaves a url without search parameters unchanged", () => {
            const req = new Request(VALID_URL);
            expect(stripSearchParams(req).toString()).toBe(VALID_URL);
        });

        it("removes search params but retains path", () => {
            const url = `${VALID_URL}path/to/resource?a=1&b=2`;
            const req = new Request(url);
            expect(stripSearchParams(req).toString()).toBe(`${VALID_URL}path/to/resource`);
        });

        it("removes search params and hash if present", () => {
            const url = `${VALID_URL}?a=1#section`;
            const req = new Request(url);
            expect(stripSearchParams(req).toString()).toBe(`${VALID_URL}`);
        });
    });
});
