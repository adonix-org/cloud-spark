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

import { describe, it, expect } from "vitest";
import { env, ctx } from "./mock";
import { GET_REQUEST } from "./constants";
import { BasicWorker } from "../src/basic-worker";
import { Middleware } from "../src/middleware";
import { Unauthorized } from "../src/errors";
import { Worker } from "../src/worker";

class TestWorker extends BasicWorker {
    constructor(request: Request) {
        super(request, env, ctx);
    }

    protected init(): void {
        this.use(new AddHeader());
    }

    protected override async dispatch(): Promise<Response> {
        return new Response("Ok");
    }
}

class AddHeader extends Middleware {
    override async handle(_worker: Worker, next: () => Promise<Response>): Promise<Response> {
        const response = await next();
        response.headers.set("x-custom-header", String(true));
        return response;
    }
}

class AuthWorker extends TestWorker {
    protected init(): void {
        this.use(new AuthHandler());
    }
}

class AuthHandler extends Middleware {
    public override handle(worker: Worker): Promise<Response> {
        return new Unauthorized(worker).getResponse();
    }
}

describe("middleware unit tests", () => {
    it("adds a header to the response", async () => {
        const worker = new TestWorker(GET_REQUEST);
        const response = await worker.fetch();
        expect([...response.headers.entries()]).toStrictEqual([
            ["content-type", "text/plain;charset=UTF-8"],
            ["x-custom-header", "true"],
        ]);
    });

    it("interrupts middleware processing with unauthorized", async () => {
        const worker = new AuthWorker(GET_REQUEST);
        const response = await worker.fetch();
        const json = await response.json();
        expect(json).toStrictEqual({
            details: "",
            error: "Unauthorized",
            status: 401,
        });
        expect([...response.headers.entries()]).toStrictEqual([
            ["cache-control", "no-cache, no-store, must-revalidate, max-age=0"],
            ["content-type", "application/json; charset=utf-8"],
            ["x-content-type-options", "nosniff"],
        ]);
    });
});
