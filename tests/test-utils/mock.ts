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

class MockWebSocket {
    readyState = WebSocket.OPEN;
    sent: any[] = [];
    listeners: Record<string, Function[]> = {};
    attachment: any = null;

    addEventListener(event: string, cb: Function) {
        let array = this.listeners[event];
        if (!array) {
            array = [];
            this.listeners[event] = array;
        }
        array.push(cb);
    }

    removeEventListener(event: string, cb: Function) {
        const arr = this.listeners[event];
        if (!arr) return;

        const index = arr.indexOf(cb);
        if (index !== -1) {
            arr.splice(index, 1);
        }
    }

    send(data: any) {
        this.sent.push(data);
        this.listeners["message"]?.forEach((f) => f({ data }));
    }

    accept(): void {
        // no-op for testing
    }

    close(code?: number, reason?: string) {
        this.readyState = WebSocket.CLOSED;
        this.listeners["close"]?.forEach((f) => f({ code, reason }));
    }

    serializeAttachment(obj: any) {
        this.attachment = obj;
    }
    deserializeAttachment() {
        return this.attachment;
    }
}

export function createMockWebSocketPair(): [MockWebSocket, MockWebSocket] {
    const a = new MockWebSocket();
    const b = new MockWebSocket();

    // link send to the other side
    a.send = (data: any) => {
        a.sent.push(data);
        b.listeners["message"]?.forEach((f) => f({ data }));
    };
    b.send = (data: any) => {
        b.sent.push(data);
        a.listeners["message"]?.forEach((f) => f({ data }));
    };

    a.close = (code?: number, reason?: string) => {
        a.readyState = WebSocket.CLOSED;
        a.listeners["close"]?.forEach((f) => f({ code, reason }));
        b.listeners["close"]?.forEach((f) => f({ code, reason }));
    };
    b.close = (code?: number, reason?: string) => {
        b.readyState = WebSocket.CLOSED;
        b.listeners["close"]?.forEach((f) => f({ code, reason }));
        a.listeners["close"]?.forEach((f) => f({ code, reason }));
    };

    return [a, b];
}

(globalThis as any).WebSocketPair = createMockWebSocketPair;
