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

class InMemoryCache {
    public store: Record<string, Response> = {};

    get size(): number {
        return Object.keys(this.store).length;
    }

    get isEmpty(): boolean {
        return this.size === 0;
    }

    match(key: string | Request): Response | undefined {
        const k = key instanceof Request ? key.url : key;
        return this.store[k];
    }

    matchAll(key?: string | Request): Response[] {
        const k = key instanceof Request ? key.url : key;
        if (!k) return Object.values(this.store);
        const resp = this.store[k];
        return resp ? [resp] : [];
    }

    put(key: string | Request, response: Response): void {
        const k = key instanceof Request ? key.url : key;
        this.store[k] = response.clone();
    }

    delete(key: string | Request): boolean {
        const k = key instanceof Request ? key.url : key;
        const existed = k in this.store;
        delete this.store[k];
        return existed;
    }

    clear(): void {
        this.store = {};
    }
}

export const defaultCache = new InMemoryCache();
export const namedCache = new InMemoryCache();

const caches = {
    default: defaultCache,
    open: async (_name: string) => namedCache,
};

(globalThis as any).caches = caches;
