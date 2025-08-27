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
    GET_REQUEST_WITH_ORIGIN,
    INVALID_ORIGIN,
    TestCorsWorker,
    TestCorsWorkerOrigin,
    VALID_ORIGIN,
} from "./constants";
import { addCorsHeaders } from "../src/cors";
import { getOrigin } from "../src/common";
import { CorsWorker } from "../src/cors-worker";

describe("cors headers allow any origin", () => {
    let worker: TestCorsWorker;
    let headers: Headers;

    beforeEach(() => {
        worker = new TestCorsWorker(GET_REQUEST_WITH_ORIGIN, env, ctx);
        headers = new Headers();
    });

    it("no cors headers null origin", () => {
        addCorsHeaders(null, worker, headers);
        expect([...headers.entries()]).toStrictEqual([]);
    });

    it("no cors headers empty origin", () => {
        addCorsHeaders("", worker, headers);
        expect([...headers.entries()]).toStrictEqual([]);
    });

    it("no cors headers whitespce origin", () => {
        addCorsHeaders(" ", worker, headers);
        expect([...headers.entries()]).toStrictEqual([]);
    });

    it("cors headers allow any origin", () => {
        addCorsHeaders(getOrigin(worker.request), worker, headers);
        expect([...headers.entries()]).toStrictEqual([
            ["access-control-allow-headers", "Content-Type"],
            ["access-control-allow-methods", "GET, OPTIONS, HEAD"],
            ["access-control-allow-origin", "*"],
            ["access-control-max-age", "604800"],
        ]);
    });

    it("cors delete headers", () => {
        headers = new Headers([
            ["access-control-allow-credentials", "true"],
            ["access-control-allow-headers", "Content-Type"],
            ["access-control-allow-methods", "GET, OPTIONS, HEAD"],
            ["access-control-allow-origin", "https://localhost"],
            ["access-control-max-age", "604800"],
            ["vary", "Origin"],
        ]);
        addCorsHeaders(null, worker, headers);
        expect([...headers.entries()]).toStrictEqual([["vary", "Origin"]]);
    });
});

describe("cors headers allow specific origin", () => {
    let worker: CorsWorker;
    let headers: Headers;

    beforeEach(() => {
        worker = new TestCorsWorkerOrigin(GET_REQUEST_WITH_ORIGIN, env, ctx);
        headers = new Headers();
    });

    it("cors headers includes valid origin", () => {
        addCorsHeaders(VALID_ORIGIN, worker, headers);
        expect([...headers.entries()]).toStrictEqual([
            ["access-control-allow-credentials", "true"],
            ["access-control-allow-headers", "Content-Type"],
            ["access-control-allow-methods", "GET, OPTIONS, HEAD"],
            ["access-control-allow-origin", "https://localhost"],
            ["access-control-max-age", "604800"],
            ["vary", "Origin"],
        ]);
    });

    it("cors headers invalid origin", () => {
        addCorsHeaders(INVALID_ORIGIN, worker, headers);
        expect([...headers.entries()]).toStrictEqual([
            ["access-control-allow-headers", "Content-Type"],
            ["access-control-allow-methods", "GET, OPTIONS, HEAD"],
            ["access-control-max-age", "604800"],
        ]);
    });
});
