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

import { normalizeUrl } from "@src/utils/url";
import { describe, expect, it } from "vitest";

describe("url function unit tests", () => {
    describe("normalize url function", () => {
        const BASE = "https://localhost/";

        it("does not modify a url with no search parameters", () => {
            expect(normalizeUrl(BASE).toString()).toBe(BASE);
        });

        it("retains the single search parameter in a url", () => {
            const url = `${BASE}?a=1`;
            expect(normalizeUrl(url).toString()).toBe(url);
        });

        it("does not modify pre-sorted search parameters", () => {
            const url = `${BASE}?a=1&b=2&c=3`;
            expect(normalizeUrl(url).toString()).toBe(url);
        });

        it("sorts the url search parameters", () => {
            const url = `${BASE}?&b=2&c=3&a=1`;
            expect(normalizeUrl(url).toString()).toBe(`${BASE}?a=1&b=2&c=3`);
        });

        it("sorts and retains search parameters containing duplicate keys", () => {
            const url = `${BASE}?&b=2&a=4&c=3&a=1`;

            // normalizeUrl sorts keys alphabetically, but preserves the order of duplicate keys.
            // So here we expect both 'a' parameters in the original order (4 then 1) to be retained,
            // even though 'a' comes before 'b' and 'c' after sorting.
            expect(normalizeUrl(url).toString()).toBe(`${BASE}?a=4&a=1&b=2&c=3`);
        });
    });
});
