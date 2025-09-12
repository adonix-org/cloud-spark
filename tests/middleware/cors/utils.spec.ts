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

import { defaultCorsConfig } from "@src/middleware/cors/constants";
import { setAllowOrigin } from "@src/middleware/cors/utils";
import { beforeEach, describe, expect, it } from "vitest";

describe("cors utils unit tests", () => {
    let headers: Headers;

    beforeEach(() => {
        headers = new Headers();
    });

    describe("allow origin function", () => {
        it("adds * header when configured for any origin", () => {
            setAllowOrigin(headers, defaultCorsConfig, "http://localhost");
            expect([...headers.entries()]).toStrictEqual([["access-control-allow-origin", "*"]]);
        });

        it("adds header for specifc allowed origin", () => {
            setAllowOrigin(
                headers,
                { ...defaultCorsConfig, allowedOrigins: ["http://localhost"] },
                "http://localhost",
            );
            expect([...headers.entries()]).toStrictEqual([
                ["access-control-allow-origin", "http://localhost"],
                ["vary", "Origin"],
            ]);
        });

        it("does not add header for invalid origin", () => {
            setAllowOrigin(
                headers,
                { ...defaultCorsConfig, allowedOrigins: ["http://localhost"] },
                "http://localhost.invalid",
            );
            expect([...headers.entries()]).toStrictEqual([["vary", "Origin"]]);
        });
    });
});
