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

import {
    expectHeadersEqual,
    GET_REQUEST,
    GET_REQUEST_WITH_ORIGIN,
    VALID_ORIGIN,
    VALID_URL,
} from "@common";
import { StatusCodes } from "@src/constants";
import { HttpHeader } from "@src/constants/headers";
import { DELETE, GET, OPTIONS, POST, PUT } from "@src/constants/methods";
import { CorsConfig } from "@src/middleware/cors/interfaces";
import { defaultCorsConfig } from "@src/middleware/cors/constants";
import {
    apply,
    getOrigin,
    options,
    setAllowCredentials,
    setAllowHeaders,
    setAllowMethods,
    setAllowOrigin,
    setExposedHeaders,
    setMaxAge,
    setVaryOrigin,
    skipCors,
} from "@src/middleware/cors/utils";
import { WS_WEBSOCKET } from "@src/middleware/websocket/constants";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("cors utils unit tests", () => {
    let headers: Headers;

    beforeEach(() => {
        headers = new Headers();
    });

    describe("options function", () => {
        it("returns a valid preflight response with expected headers for a specific allowed origin", async () => {
            const worker = {
                request: new Request(VALID_URL, {
                    method: "OPTIONS",
                    headers: { Origin: "https://foo.com" },
                }),
                getAllowedMethods: () => {
                    return [GET, POST, OPTIONS];
                },
            };
            const cors: CorsConfig = {
                allowedOrigins: ["https://foo.com"],
                allowCredentials: true,
                maxAge: 86400,
                allowedHeaders: [],
                exposedHeaders: [],
            };

            const source = new Response(null, { status: 204 });
            const response = await options(source, worker as any, cors);

            expect(response).toBeInstanceOf(Response);
            expect(response.status).toBe(204);
            expectHeadersEqual(response.headers, [
                ["access-control-allow-credentials", "true"],
                ["access-control-allow-methods", "GET, OPTIONS, POST"],
                ["access-control-allow-origin", "https://foo.com"],
                ["access-control-max-age", "86400"],
                ["vary", "origin"],
            ]);
        });

        it("returns a valid preflight response with expected headers for * allowed origins", async () => {
            const worker = {
                request: new Request(VALID_URL, {
                    method: "OPTIONS",
                    headers: { Origin: "https://foo.com" },
                }),
                getAllowedMethods: () => {
                    return [GET, POST, OPTIONS];
                },
            };
            const cors: CorsConfig = {
                allowedOrigins: ["*"],
                allowCredentials: true,
                maxAge: 86400,
                allowedHeaders: ["x-header-1"],
                exposedHeaders: ["x-header-2, x-header-3"],
            };
            const source = new Response(null, { status: 204 });
            const response = await options(source, worker as any, cors);

            expect(response).toBeInstanceOf(Response);
            expect(response.status).toBe(204);
            expectHeadersEqual(response.headers, [
                ["access-control-allow-headers", "x-header-1"],
                ["access-control-allow-methods", "GET, OPTIONS, POST"],
                ["access-control-allow-origin", "*"],
                ["access-control-max-age", "86400"],
            ]);
        });

        it("returns an empty preflight response for no origin", async () => {
            const worker = {
                request: new Request(VALID_URL, {
                    method: "OPTIONS",
                }),
                getAllowedMethods: () => {
                    return [GET, POST, OPTIONS];
                },
            };
            const source = new Response(null);
            const response = await options(source, worker as any, defaultCorsConfig);

            expect(response).toBeInstanceOf(Response);
            expect(response.status).toBe(200);
            expectHeadersEqual(response.headers, []);
        });
    });

    describe("apply function", () => {
        it("returns a valid cors response with expected headers for a specific allowed origin", async () => {
            const worker = {
                request: new Request(VALID_URL, {
                    headers: { Origin: "https://foo.com" },
                }),
            };
            const cors: CorsConfig = {
                allowedOrigins: ["https://foo.com"],
                allowCredentials: true,
                maxAge: 86400,
                allowedHeaders: [],
                exposedHeaders: ["x-header-1"],
            };
            const r = new Response("ok", { headers: { "x-header-2": "preserved" } });
            const response = await apply(r, worker as any, cors);

            expectHeadersEqual(response.headers, [
                ["access-control-allow-credentials", "true"],
                ["access-control-allow-origin", "https://foo.com"],
                ["access-control-expose-headers", "x-header-1"],
                ["content-type", "text/plain;charset=UTF-8"],
                ["vary", "origin"],
                ["x-header-2", "preserved"],
            ]);
        });

        it("returns a valid cors response with expected headers for * allowed origins", async () => {
            const worker = {
                request: new Request(VALID_URL, {
                    headers: { Origin: "https://foo.com" },
                }),
            };
            const cors: CorsConfig = {
                allowedOrigins: ["*"],
                allowCredentials: true,
                maxAge: 86400,
                allowedHeaders: [],
                exposedHeaders: ["x-header-1"],
            };
            const r = new Response("ok", { headers: { "x-header-2": "preserved" } });
            const response = await apply(r, worker as any, cors);

            expectHeadersEqual(response.headers, [
                ["access-control-allow-origin", "*"],
                ["access-control-expose-headers", "x-header-1"],
                ["content-type", "text/plain;charset=UTF-8"],
                ["x-header-2", "preserved"],
            ]);
        });
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
            expectHeadersEqual(headers, [["access-control-allow-origin", "http://localhost"]]);
        });

        it("does not add the header for invalid origin", () => {
            setAllowOrigin(
                headers,
                { ...defaultCorsConfig, allowedOrigins: ["http://localhost"] },
                "http://localhost.invalid",
            );
            expectHeadersEqual(headers, []);
        });
    });

    describe("set vary origin function", () => {
        it("adds vary header when allowed origins is not *", () => {
            setVaryOrigin(headers, { ...defaultCorsConfig, allowedOrigins: ["http://localhost"] });
            expectHeadersEqual(headers, [["vary", "origin"]]);
        });

        it("does not add vary header when allowed origins is *", () => {
            setVaryOrigin(headers, { ...defaultCorsConfig, allowedOrigins: ["*"] });
            expectHeadersEqual(headers, []);
        });

        it("correctly merges vary header when allowed origin is not *", () => {
            headers.set(HttpHeader.VARY, "accept");
            setVaryOrigin(headers, { ...defaultCorsConfig, allowedOrigins: ["http://localhost"] });
            expectHeadersEqual(headers, [["vary", "accept, origin"]]);
        });

        it("preserves existing vary header when allowed origin is *", () => {
            headers.set(HttpHeader.VARY, "accept");
            setVaryOrigin(headers, { ...defaultCorsConfig, allowedOrigins: ["*"] });
            expectHeadersEqual(headers, [["vary", "accept"]]);
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
    });

    describe("set allow headers function", () => {
        it("sets the default allow headers from default cors config", () => {
            setAllowHeaders(headers, defaultCorsConfig);
            expectHeadersEqual(headers, [["access-control-allow-headers", "content-type"]]);
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

    describe("get origin function", () => {
        it("returns null for no origin header in the request", () => {
            expect(getOrigin(GET_REQUEST)).toBe(null);
        });

        it("returns the origin from the origin header in the request", () => {
            expect(getOrigin(GET_REQUEST_WITH_ORIGIN)).toBe(VALID_ORIGIN);
        });

        it("returns null for 'null' string origin", () => {
            const request = new Request(VALID_URL, {
                headers: {
                    Origin: "null",
                },
            });
            expect(getOrigin(request)).toBe(null);
        });

        it("returns null for invalid origin", () => {
            const request = new Request(VALID_URL, {
                headers: {
                    Origin: "not a valid origin",
                },
            });
            expect(getOrigin(request)).toBe(null);
        });

        it("returns the normalized origin", () => {
            const request = new Request(VALID_URL, {
                headers: {
                    Origin: "https://localhost/path",
                },
            });
            expect(getOrigin(request)).toBe("https://localhost");
        });

        it("returns the normalized origin with port", () => {
            const request = new Request(VALID_URL, {
                headers: {
                    Origin: "https://localhot:3000/",
                },
            });
            expect(getOrigin(request)).toBe("https://localhot:3000");
        });
    });
});
