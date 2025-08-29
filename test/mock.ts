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

import type { ExecutionContext } from "@cloudflare/workers-types";

export const env = {
    MY_KV: {
        get: async (key: string) => `mock-value-for-${key}`,
        put: async (_key: string, _value: string) => {},
    },
    MY_SECRET: "mock-secret",
} as const;

export const ctx: ExecutionContext = {
    waitUntil: () => {},
    passThroughOnException: () => {},
    props: () => {},
} as const;

type CacheEntry = { request: string; response: Response };

class InMemoryCache {
    private store: Record<string, Response> = {};

    async match(request: RequestInfo): Promise<Response | undefined> {
        const key = typeof request === "string" ? request : request.url;
        return this.store[key];
    }

    async matchAll(request?: RequestInfo): Promise<Response[]> {
        if (!request) return Object.values(this.store);
        const key = typeof request === "string" ? request : request.url;
        const resp = this.store[key];
        return resp ? [resp] : [];
    }

    async put(request: RequestInfo, response: Response): Promise<void> {
        const key = typeof request === "string" ? request : request.url;
        // store a clone so the original Response can still be read
        this.store[key] = response.clone();
    }

    async delete(request: RequestInfo): Promise<boolean> {
        const key = typeof request === "string" ? request : request.url;
        const existed = key in this.store;
        delete this.store[key];
        return existed;
    }

    clear(): void {
        this.store = {};
    }
}

const defaultCache = new InMemoryCache();

const caches = {
    default: defaultCache,
    open: async (_name: string) => defaultCache,
};

(globalThis as any).caches = caches;
