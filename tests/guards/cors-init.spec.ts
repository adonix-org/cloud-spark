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

import { assertCorsInit } from "@src/guards/cors-init";
import { describe, it, expect } from "vitest";

describe("cors init guard unit tests", () => {
    describe("assert cors init", () => {
        it("allows undefined (default config)", () => {
            expect(() => assertCorsInit(undefined)).not.toThrow();
        });

        it("allows an empty object", () => {
            expect(() => assertCorsInit({})).not.toThrow();
        });

        it("allows valid CorsInit with all fields", () => {
            const valid: any = {
                allowedOrigins: ["*"],
                allowedHeaders: ["Content-Type", "Authorization"],
                exposedHeaders: ["X-Custom"],
                allowCredentials: true,
                maxAge: 3600,
            };
            expect(() => assertCorsInit(valid)).not.toThrow();
        });

        it("allows partial CorsInit", () => {
            const partial: any = {
                allowedOrigins: ["https://example.com"],
                maxAge: 120,
            };
            expect(() => assertCorsInit(partial)).not.toThrow();
        });

        it("throws if value is null or not an object", () => {
            expect(() => assertCorsInit(null)).toThrow(TypeError);
            expect(() => assertCorsInit(123)).toThrow(TypeError);
            expect(() => assertCorsInit("hello")).toThrow(TypeError);
            expect(() => assertCorsInit(true)).toThrow(TypeError);
        });

        it("throws if allowedOrigins is invalid", () => {
            expect(() => assertCorsInit({ allowedOrigins: "not-an-array" })).toThrow(
                /allowedOrigins must be a string array/,
            );
            expect(() => assertCorsInit({ allowedOrigins: [1, 2, 3] })).toThrow(
                /allowedOrigins must be a string array/,
            );
        });

        it("throws if allowedHeaders is invalid", () => {
            expect(() => assertCorsInit({ allowedHeaders: "not-an-array" })).toThrow(
                /allowedHeaders must be a string array/,
            );
            expect(() => assertCorsInit({ allowedHeaders: [true, "X"] })).toThrow(
                /allowedHeaders must be a string array/,
            );
        });

        it("throws if exposedHeaders is invalid", () => {
            expect(() => assertCorsInit({ exposedHeaders: "not-an-array" })).toThrow(
                /exposedHeaders must be a string array/,
            );
            expect(() => assertCorsInit({ exposedHeaders: [1, "X"] })).toThrow(
                /exposedHeaders must be a string array/,
            );
        });

        it("throws if allowCredentials is not a boolean", () => {
            expect(() => assertCorsInit({ allowCredentials: "yes" })).toThrow(
                /allowCredentials must be a boolean/,
            );
            expect(() => assertCorsInit({ allowCredentials: 1 })).toThrow(
                /allowCredentials must be a boolean/,
            );
        });

        it("throws if maxAge is not a number", () => {
            expect(() => assertCorsInit({ maxAge: "3600" })).toThrow(/maxAge must be a number/);
            expect(() => assertCorsInit({ maxAge: true })).toThrow(/maxAge must be a number/);
        });
    });
});
