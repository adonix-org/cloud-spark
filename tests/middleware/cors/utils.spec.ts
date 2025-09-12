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

import { expectHeadersEqual } from "@common";
import { HttpHeader } from "@src/constants";
import { defaultCorsConfig } from "@src/middleware/cors/constants";
import { setAllowCredentials, setAllowOrigin } from "@src/middleware/cors/utils";
import { beforeEach, describe, it } from "vitest";

describe("cors utils unit tests", () => {
    let headers: Headers;

    beforeEach(() => {
        headers = new Headers();
    });

    describe("set allow origin function", () => {
        it("adds * header when configured for any origin", () => {
            setAllowOrigin(headers, defaultCorsConfig, "http://localhost");
            expectHeadersEqual(headers, [["access-control-allow-origin", "*"]]);
        });

        it("adds header for specifc allowed origin", () => {
            setAllowOrigin(
                headers,
                { ...defaultCorsConfig, allowedOrigins: ["http://localhost"] },
                "http://localhost",
            );
            expectHeadersEqual(headers, [
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
            expectHeadersEqual(headers, [["vary", "Origin"]]);
        });

        it("correctly merges vary header for a valid origin", () => {
            headers.set(HttpHeader.VARY, "Accept");
            setAllowOrigin(
                headers,
                { ...defaultCorsConfig, allowedOrigins: ["http://localhost"] },
                "http://localhost",
            );
            expectHeadersEqual(headers, [
                ["vary", "Accept, Origin"],
                ["access-control-allow-origin", "http://localhost"],
            ]);
        });

        it("correctly merges vary header for an invalid origin", () => {
            headers.set(HttpHeader.VARY, "Accept");
            setAllowOrigin(
                headers,
                { ...defaultCorsConfig, allowedOrigins: ["http://localhost"] },
                "http://localhost.invalid",
            );
            expectHeadersEqual(headers, [["vary", "Accept, Origin"]]);
        });
    });

    describe("set allow credentials function", () => {
        it("does not add header when allow credenitals is false", () => {
            setAllowCredentials(headers, defaultCorsConfig, "http://localhost");
            expectHeadersEqual(headers, []);
        });

        it("does not add header when any origin is allowed", () => {
            setAllowCredentials(
                headers,
                { ...defaultCorsConfig, allowCredentials: true },
                "http://localhost",
            );
            expectHeadersEqual(headers, []);
        });

        it("does not add header when origin is not included in allowed origins", () => {
            setAllowCredentials(
                headers,
                {
                    ...defaultCorsConfig,
                    allowCredentials: true,
                    allowedOrigins: ["http://localhost"],
                },
                "http://localhost.invalid",
            );
            expectHeadersEqual(headers, []);
        });

        it("adds header only when all conditions are met", () => {
            setAllowCredentials(
                headers,
                {
                    ...defaultCorsConfig,
                    allowCredentials: true,
                    allowedOrigins: ["http://localhost"],
                },
                "http://localhost",
            );
            expectHeadersEqual(headers, [["access-control-allow-credentials", "true"]]);
        });
    });
});
