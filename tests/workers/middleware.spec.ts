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

import { expectHeadersEqual, GET_REQUEST } from "@common";
import { ctx, env } from "@mock";
import { GET, HEAD, Method, OPTIONS } from "@src/constants";
import { Unauthorized } from "@src/errors";
import { Middleware } from "@src/interfaces/middleware";
import { Worker } from "@src/interfaces/worker";
import { MiddlewareWorker } from "@src/workers/middleware";
import { describe, expect, it } from "vitest";

class TestWorker extends MiddlewareWorker {
    constructor(request: Request) {
        super(request, env, ctx);
    }

    protected override async dispatch(): Promise<Response> {
        return new Response("Ok");
    }

    public getAllowedMethods(): Method[] {
        return [GET, HEAD, OPTIONS];
    }
}

class AddHeader implements Middleware {
    async handle(_worker: Worker, next: () => Promise<Response>): Promise<Response> {
        const response = await next();
        response.headers.set("x-custom-header", String(true));
        return response;
    }
}

class AuthWorker extends TestWorker {
    protected init(): void {
        this.use(new AuthHandler());
        this.use(new AddHeader());
    }
}

class AuthHandler implements Middleware {
    handle(): Promise<Response> {
        return new Unauthorized().response();
    }
}

class LogMiddleware implements Middleware {
    constructor(
        public name: string,
        public log: string[],
    ) {}

    async handle(_worker: Worker, next: () => Promise<Response>): Promise<Response> {
        this.log.push(`pre-${this.name}`);
        const response = await next();
        this.log.push(`post-${this.name}`);
        return response;
    }
}

describe("middleware unit tests", () => {
    it("executes the middleware in the onion pattern", async () => {
        const log: string[] = [];
        const mw1 = new LogMiddleware("first", log);
        const mw2 = new LogMiddleware("second", log);

        class OrderWorker extends TestWorker {
            init() {
                this.use(mw1);
                this.use(mw2);
            }
        }

        await new OrderWorker(GET_REQUEST).fetch();
        expect(log).toStrictEqual(["pre-first", "pre-second", "post-second", "post-first"]);
    });

    it("short-circuits when a middleware returns early", async () => {
        const log: string[] = [];
        const mw1 = new LogMiddleware("first", log);
        const mw2: Middleware = {
            handle: async (_worker, _next) => {
                log.push("pre-second");
                return new Response("short circuited");
            },
        };

        class ShortCircuitWorker extends TestWorker {
            init() {
                this.use(mw1);
                this.use(mw2);
            }
        }

        const response = await new ShortCircuitWorker(GET_REQUEST).fetch();
        expect(await response.text()).toBe("short circuited");
        expect(log).toStrictEqual(["pre-first", "pre-second", "post-first"]);
    });

    it("adds a header to the response", async () => {
        class HeaderWorker extends TestWorker {
            init() {
                this.use(new AddHeader());
            }
        }

        const response = await new HeaderWorker(GET_REQUEST).fetch();
        expectHeadersEqual(response.headers, [
            ["content-type", "text/plain;charset=UTF-8"],
            ["x-custom-header", "true"],
        ]);
    });

    it("interrupts middleware processing when unauthorized", async () => {
        const worker = new AuthWorker(GET_REQUEST);
        const response = await worker.fetch();
        const json = await response.json();

        expect(json).toStrictEqual({
            details: "",
            error: "Unauthorized",
            status: 401,
        });
        expectHeadersEqual(response.headers, [
            ["cache-control", "no-cache, no-store, must-revalidate, max-age=0"],
            ["content-type", "application/json; charset=utf-8"],
        ]);
    });
});
