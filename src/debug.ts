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

import { Method } from "./common";
import { JsonResponse, TextResponse } from "./response";
import { RoutedWorker } from "./routed-worker";

const mockCtx: ExecutionContext = {
    waitUntil: () => {},
    passThroughOnException: () => {},
    props: () => {},
};
mockCtx;

const mockEnv = {
    MY_KV: {
        get: async (key: string) => `mock-value-for-${key}`,
        put: async (_key: string, _value: string) => {},
    },
    MY_SECRET: "mock-secret",
};
mockEnv;

// no-op cache for local/testing
const caches = {
    default: {
        async match(_request: RequestInfo, _options?: any): Promise<Response | undefined> {
            return undefined;
        },
        async matchAll(_request?: RequestInfo, _options?: any): Promise<Response[]> {
            return [];
        },
        async put(_request: RequestInfo, _response: Response): Promise<void> {
            // no-op
        },
        async delete(_request: RequestInfo, _options?: any): Promise<boolean> {
            return false;
        },
    },
} as const;

(globalThis as any).caches = caches;

type Toppings = "pepperoni" | "sausage" | "cheese" | "olives" | "xtra cheese" | "ham" | "pineapple";
interface Pizza {
    size: "small" | "medium" | "large" | "x-large" | "sheet";
    style: "New York" | "Chicago" | "Detroit";
    toppings: Toppings[];
}

class DebugWorker extends RoutedWorker {
    private static PLAYLIST = "^/api/v1/seasons/(\\d{4})$";
    private static SEASONS = "^/api/v1/seasons$";
    private static LAST = "^/api/v1/seasons/last$";

    constructor(request: Request, env: Env = {}, ctx: ExecutionContext) {
        super(request, env, ctx);

        this.add(Method.GET, DebugWorker.PLAYLIST, this.getSeason)
            .add(Method.GET, DebugWorker.SEASONS, this.getSeasons)
            .add(
                Method.GET,
                DebugWorker.LAST,
                async (): Promise<Response> => this.getResponse(JsonResponse, [2026])
            );
    }

    protected async getSeason(...matches: string[]): Promise<Response> {
        return this.getResponse(JsonResponse, { season: matches[1] });
    }

    protected async getSeasons(): Promise<Response> {
        return this.getResponse(JsonResponse, [2001, 20002, 2003, 2004], {
            public: true,
            "s-maxage": 60000,
        });
    }

    public override getAllowMethods(): Method[] {
        return [...super.getAllowMethods(), Method.POST, Method.DELETE];
    }

    protected override async get(): Promise<Response> {
        console.info("request text = ", await this.request.text());
        //return this.getResponse(InternalServerError, "Goodbye World!");
        return this.getResponse(TextResponse, "Hello 🌎", { public: true, "max-age": 0 });
    }

    protected override async post(): Promise<Response> {
        const pizza = (await this.request.json()) as Pizza;
        return this.getResponse(JsonResponse, pizza, { "no-store": true });
    }

    public override getAllowOrigins(): string[] {
        return ["https://www.adonix.org"];
    }

    public override getCacheKey(): URL | RequestInfo {
        return super.getCacheKey();
    }
}

const method: Method = Method.HEAD;

const request = new Request("https://www.adonix.org/api/v1/seasons/last", {
    method: method,
    headers: {
        Origin: "https://www.adonix.org",
    },
    /**body: JSON.stringify({
        size: "large",
        style: "New York",
        toppings: ["pepperoni", "sausage", "cheese"],
    }),*/
});

const worker = new DebugWorker(request, mockEnv, mockCtx);
const response = await worker.fetch();

// const response = await DebugWorker.ignite().fetch(request, mockEnv, mockCtx);

// const clone = new ClonedResponse(worker, response, { private: true, "max-age": 9000 });
// console.log(clone.createResponse());

console.log(response);
console.log(await response.text());

const instances = 10;
let start = performance.now();
const workers: DebugWorker[] = [];
for (let i = 0; i < instances; i++) {
    workers.push(new DebugWorker(request, mockEnv, mockCtx));
}

let end = performance.now();
console.log(`\nConstructing ${instances} DebugWorkers took ${(end - start).toFixed(4)} ms`);
