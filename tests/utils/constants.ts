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
import { HEAD, Method } from "@src/common";
import { MatchedRoute, RouteCallback, RouteTable } from "@src/interfaces/route";
import { WorkerClass } from "@src/interfaces/worker";

export const VALID_ORIGIN = "https://localhost";
export const INVALID_ORIGIN = "https://localhost.invalid";

export const VALID_URL = `${VALID_ORIGIN}/`;

export const ALL_METHODS: Method[] = Object.values(Method);
export const SPECIAL_METHODS: Method[] = [HEAD];
export const BASIC_METHODS: Method[] = ALL_METHODS.filter(
    (method) => !SPECIAL_METHODS.includes(method),
);

export namespace TestRoutes {
    export const one: RouteCallback = () => {
        return new Response("one");
    };

    export const two: RouteCallback = () => {
        return new Response("two");
    };

    export const three: RouteCallback = () => {
        return new Response("three");
    };

    export const four: RouteCallback = () => {
        return new Response("four");
    };

    export const table: RouteTable = [
        [Method.GET, "/one", one],
        [Method.GET, "/two", two],
        [Method.GET, "/three", three],
        [Method.GET, "/four", four],
    ];

    export async function expectResponseBody(found: MatchedRoute, expected: string) {
        const { handler } = found.route;
        if (isCallback(handler)) {
            const response = await handler(found.params);
            expect(await response.text()).toBe(expected);
        }
    }
}

function isCallback(handler: RouteCallback | WorkerClass): handler is RouteCallback {
    return !Boolean((handler as any)?.prototype?.fetch);
}

export const GET_REQUEST = new Request(VALID_URL, {
    method: Method.GET,
});

export const GET_REQUEST_WITH_ORIGIN = new Request(VALID_URL, {
    method: Method.GET,
    headers: {
        Origin: VALID_ORIGIN,
        "Sec-Fetch-Site": "cross-site",
    },
});

export const GET_REQUEST_INVALID_ORIGIN = new Request(VALID_URL, {
    method: Method.GET,
    headers: {
        Origin: INVALID_ORIGIN,
        "Sec-Fetch-Site": "cross-site",
    },
});

export const BODY_INIT: BodyInit = "OK";

export function assertDefined<T>(value: T | null | undefined, message?: string): T {
    if (value === null || value === undefined) {
        throw new Error(message ?? "Unexpected null or undefined");
    }
    return value;
}
