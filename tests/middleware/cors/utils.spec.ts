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
import { WS_WEBSOCKET } from "@src/constants";
import {
    DELETE,
    GET,
    HEAD,
    HttpHeader,
    OPTIONS,
    POST,
    PUT,
    StatusCodes,
} from "@src/constants/http";
import { defaultCorsConfig } from "@src/middleware/cors/constants";
import {
    setAllowCredentials,
    setAllowHeaders,
    setAllowMethods,
    setAllowOrigin,
    setExposedHeaders,
    setMaxAge,
    skipCors,
} from "@src/middleware/cors/utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

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

        it("adds the header for specifc allowed origin", () => {
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

        it("does not add the header for invalid origin", () => {
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
        it("does not add the header when allow credenitals is false", () => {
            setAllowCredentials(headers, defaultCorsConfig, "http://localhost");
            expectHeadersEqual(headers, []);
        });

        it("does not add the header when any origin is allowed", () => {
            setAllowCredentials(
                headers,
                { ...defaultCorsConfig, allowCredentials: true },
                "http://localhost",
            );
            expectHeadersEqual(headers, []);
        });

        it("does not add the header when origin is not included in allowed origins", () => {
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

        it("adds the header only when all conditions are met", () => {
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

    describe("set allow methods function", () => {
        it("does not add the header for simple methods", () => {
            const worker = {
                getAllowedMethods: vi.fn(() => [GET, HEAD, OPTIONS]),
            } as any;
            setAllowMethods(headers, worker);
            expectHeadersEqual(headers, []);
        });

        it("adds the header for non-simple method", () => {
            const worker = {
                getAllowedMethods: vi.fn(() => [POST]),
            } as any;
            setAllowMethods(headers, worker);
            expectHeadersEqual(headers, [["access-control-allow-methods", "POST"]]);
        });

        it("adds the header for non-simple methods", () => {
            const worker = {
                getAllowedMethods: vi.fn(() => [POST, PUT, DELETE]),
            } as any;
            setAllowMethods(headers, worker);
            expectHeadersEqual(headers, [["access-control-allow-methods", "DELETE, POST, PUT"]]);
        });

        it("filters the header values to remove non-simple methods", () => {
            const worker = {
                getAllowedMethods: vi.fn(() => [POST, PUT, DELETE, GET, OPTIONS]),
            } as any;
            setAllowMethods(headers, worker);
            expectHeadersEqual(headers, [["access-control-allow-methods", "DELETE, POST, PUT"]]);
        });
    });

    describe("set allow headers function", () => {
        it("sets the default allow headers from default cors config", () => {
            setAllowHeaders(headers, defaultCorsConfig);
            expectHeadersEqual(headers, [["access-control-allow-headers", "Content-Type"]]);
        });

        it("sets the allow headers from cors init config", () => {
            setAllowHeaders(headers, {
                ...defaultCorsConfig,
                allowedHeaders: ["Allow", "Age", "Connection"],
            });
            expectHeadersEqual(headers, [
                ["access-control-allow-headers", "Age, Allow, Connection"],
            ]);
        });
    });

    describe("set exposed headers function", () => {
        it("sets the detault exposed headers", () => {
            setExposedHeaders(headers, defaultCorsConfig);
            expectHeadersEqual(headers, []);
        });

        it("sets custom exposed headers", () => {
            setExposedHeaders(headers, {
                ...defaultCorsConfig,
                exposedHeaders: ["X-Test-2", "X-Test-1", "X-Test-3"],
            });
            expectHeadersEqual(headers, [
                ["access-control-expose-headers", "X-Test-1, X-Test-2, X-Test-3"],
            ]);
        });

        it("does not set exposed headers when empty", () => {
            setExposedHeaders(headers, { ...defaultCorsConfig, exposedHeaders: [] });
            expectHeadersEqual(headers, []);
        });
    });

    describe("set max age function", () => {
        it("sets the default max age", () => {
            setMaxAge(headers, defaultCorsConfig);
            expectHeadersEqual(headers, [["access-control-max-age", "300"]]);
        });

        it("sets a non-default max age", () => {
            setMaxAge(headers, { ...defaultCorsConfig, maxAge: 0 });
            expectHeadersEqual(headers, [["access-control-max-age", "0"]]);
        });

        it("sets the max age to 0 for negative values", () => {
            setMaxAge(headers, { ...defaultCorsConfig, maxAge: -1 });
            expectHeadersEqual(headers, [["access-control-max-age", "0"]]);
        });

        it("sets the max age to the nearest lower integer for decimal values", () => {
            setMaxAge(headers, { ...defaultCorsConfig, maxAge: 100.90987 });
            expectHeadersEqual(headers, [["access-control-max-age", "100"]]);
        });
    });

    describe("skip cors function", () => {
        it("returns false if cors should not be skipped for status and no headers", () => {
            const response = new Response(null, { status: StatusCodes.OK });
            expect(skipCors(response)).toBe(false);
        });

        it("returns true if status should be skipped", () => {
            const response = new Response(null, { status: StatusCodes.PERMANENT_REDIRECT });
            expect(skipCors(response)).toBe(true);
        });

        it("returns true if headers contain upgrade", () => {
            const headers = new Headers();
            headers.set(HttpHeader.UPGRADE, WS_WEBSOCKET);
            const response = new Response(null, { status: StatusCodes.OK, headers });
            expect(skipCors(response)).toBe(true);
        });

        it("returns true if both status and upgrade header are non-cors", () => {
            const headers = new Headers();
            headers.set(HttpHeader.UPGRADE, WS_WEBSOCKET);
            const response = new Response(null, {
                status: StatusCodes.PERMANENT_REDIRECT,
                headers,
            });
            expect(skipCors(response)).toBe(true);
        });
    });
});
