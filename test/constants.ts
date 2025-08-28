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
import { expect } from "vitest";
import { Method } from "../src/common";
import { CorsWorker } from "../src/cors-worker";
import { RouteCallback, RouteTable } from "../src/routes";

export const VALID_ORIGIN = "https://localhost";
export const INVALID_ORIGIN = "https://localhost.invalid";

export const VALID_URL = `${VALID_ORIGIN}/`;

export const ALL_METHODS: Method[] = Object.values(Method);
export const SPECIAL_METHODS: Method[] = [Method.HEAD, Method.OPTIONS];
export const BASIC_METHODS: Method[] = ALL_METHODS.filter(
    (method) => !SPECIAL_METHODS.includes(method)
);

export namespace TestRoutes {
    export const one: RouteCallback = async () => {
        return new Response("one");
    };

    export const two: RouteCallback = async () => {
        return new Response("two");
    };

    export const three: RouteCallback = async () => {
        return new Response("three");
    };

    export const four: RouteCallback = async () => {
        return new Response("four");
    };

    export const table: RouteTable = [
        [Method.GET, "^/one$", one],
        [Method.GET, "^/two$", two],
        [Method.GET, "^/three$", three],
        [Method.GET, "^/four$", four],
    ];

    /**
     * Execute a route callback and assert its Response body.
     * @param callback The RouteCallback to invoke
     * @param expected The expected response text
     */
    export async function expectResponseBody(callback: RouteCallback, expected: string) {
        const response = await callback();
        const text = await response.text();
        expect(text).toBe(expected);
    }
}

export const GET_REQUEST = new Request(VALID_URL, {
    method: Method.GET,
});

export const GET_REQUEST_WITH_ORIGIN = new Request(VALID_URL, {
    method: Method.GET,
    headers: {
        Origin: VALID_ORIGIN,
    },
});

export const BODY_INIT: BodyInit = "OK";

export class DefaultCorsWorker extends CorsWorker {
    public async fetch(): Promise<Response> {
        return new Response(BODY_INIT);
    }
}

export class AllowOriginWorker extends DefaultCorsWorker {
    public override getAllowOrigins(): string[] {
        return [VALID_ORIGIN];
    }
}

export class EmptyCorsWorker extends DefaultCorsWorker {
    public override getAllowOrigins(): string[] {
        return [];
    }

    public override getAllowHeaders(): string[] {
        return [];
    }

    public override getAllowMethods(): Method[] {
        return [];
    }

    public override getExposeHeaders(): string[] {
        return [];
    }

    public override getMaxAge(): number {
        return 0;
    }
}
