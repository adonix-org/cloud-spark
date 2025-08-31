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

import { describe, it, expect, beforeEach } from "vitest";
import { env, ctx } from "./mock";
import {
    GET_REQUEST,
    DefaultCorsWorker,
    AllowOriginWorker,
    VALID_ORIGIN,
    EmptyCorsWorker,
} from "./constants";
import { Method, Time } from "../src/common";

describe("cors worker unit tests", () => {
    describe("cors worker defaults", () => {
        let worker: DefaultCorsWorker;

        beforeEach(() => {
            worker = new DefaultCorsWorker(GET_REQUEST, env, ctx);
        });

        it("returns ['*'] for allow origins", () => {
            expect(worker.getAllowedOrigins()).toStrictEqual(["*"]);
        });

        it("allows any origin", () => {
            expect(worker.allowAnyOrigin()).toBe(true);
        });

        it("returns correct default allowed methods", () => {
            expect(worker.getAllowedMethods()).toStrictEqual([
                Method.GET,
                Method.HEAD,
                Method.OPTIONS,
            ]);
        });

        it("returns correct default allowed headers", () => {
            expect(worker.getAllowedHeaders()).toStrictEqual(["Content-Type"]);
        });

        it("returns empty array for exposed headers", () => {
            expect(worker.getExposedHeaders()).toStrictEqual([]);
        });

        it("returns correct default max age", () => {
            expect(worker.getMaxAge()).toBe(Time.Week);
        });
    });

    describe("cors worker valid origin", () => {
        let worker: AllowOriginWorker;

        beforeEach(() => {
            worker = new AllowOriginWorker(GET_REQUEST, env, ctx);
        });

        it("returns [VALID_ORIGIN] for allow origins", () => {
            expect(worker.getAllowedOrigins()).toStrictEqual([VALID_ORIGIN]);
        });

        it("returns false for allow any origin", () => {
            expect(worker.allowAnyOrigin()).toBe(false);
        });
    });

    describe("cors worker edge case", () => {
        let worker: AllowOriginWorker;

        beforeEach(() => {
            worker = new EmptyCorsWorker(GET_REQUEST, env, ctx);
        });

        it("returns [] for allow origins", () => {
            expect(worker.getAllowedOrigins()).toStrictEqual([]);
        });

        it("returns [] for allow headers", () => {
            expect(worker.getAllowedHeaders()).toStrictEqual([]);
        });

        it("returns [] for allow methods", () => {
            expect(worker.getAllowedMethods()).toStrictEqual([]);
        });

        it("returns [] for expose headers", () => {
            expect(worker.getExposedHeaders()).toStrictEqual([]);
        });

        it("returns false for allow any origin", () => {
            expect(worker.allowAnyOrigin()).toBe(false);
        });
    });
});
