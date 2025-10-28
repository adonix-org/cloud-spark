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

import { withCharset } from "@src/utils/media";
import { describe, expect, it } from "vitest";

describe("media function unit tests", () => {
    describe("with charset function", () => {
        it("appends charset in lowercase to a basic media type", () => {
            expect(withCharset("text/html", "UTF-8")).toBe("text/html; charset=utf-8");
        });

        it("does not duplicate charset if already present", () => {
            expect(withCharset("text/html; charset=utf-8", "utf-8")).toBe(
                "text/html; charset=utf-8",
            );
        });

        it("ignores empty charset", () => {
            expect(withCharset("text/html", "")).toBe("text/html");
        });

        it("works with other media types", () => {
            expect(withCharset("application/json", "UTF-16")).toBe(
                "application/json; charset=utf-16",
            );
        });

        it("handles unusual charsets", () => {
            expect(withCharset("text/plain", "ISO-8859-1")).toBe("text/plain; charset=iso-8859-1");
        });

        it("is case-insensitive when checking for existing charset", () => {
            expect(withCharset("TEXT/HTML; CHARSET=UTF-8", "utf-8")).toBe(
                "TEXT/HTML; CHARSET=UTF-8",
            );
        });
    });
});
