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

/**
 * Env
 */
export const env: any = {} as const;

/**
 * ExecutionContext
 */
export const ctx: ExecutionContext = {
    waitUntil: () => {},
    passThroughOnException: () => {},
    props: () => {},
} as const;

/**
 * Cache
 */
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

/**
 * WebSockets
 */
class CloseEvent extends Event {
    code: number;
    reason: string;
    constructor(type: string, init: { code?: number; reason?: string } = {}) {
        super(type);
        this.code = init.code ?? 1000;
        this.reason = init.reason ?? "";
    }
}

class MessageEvent extends Event {
    data: any;
    constructor(type: string, init: { data: any }) {
        super(type);
        this.data = init.data;
    }
}

export class MockWebSocket extends EventTarget implements WebSocket {
    binaryType: string = "arraybuffer";
    bufferedAmount = 0;
    extensions = "";
    protocol = "";
    readyState = WebSocket.OPEN;
    url = "";

    onclose: ((ev: CloseEvent) => any) | null = null;
    onerror: ((ev: Event) => any) | null = null;
    onmessage: ((ev: MessageEvent) => any) | null = null;
    onopen: ((ev: Event) => any) | null = null;

    sent: any[] = [];
    attachment: any = null;
    paired?: MockWebSocket;

    send(data: string | ArrayBuffer) {
        this.sent.push(data);
        this.paired?.dispatchEvent(new MessageEvent("message", { data }));
    }

    close(code?: number, reason?: string) {
        this.readyState = WebSocket.CLOSED;
        this.dispatchEvent(new CloseEvent("close", { code, reason }));
        if (this.paired) {
            this.paired.readyState = WebSocket.CLOSED;
            this.paired.dispatchEvent(new CloseEvent("close", { code, reason }));
        }
    }

    serializeAttachment(obj: any) {
        this.attachment = obj;
    }
    deserializeAttachment() {
        return this.attachment;
    }

    accept(): void {
        // no-op for testing
    }
}

export function WebSocketPair(): [MockWebSocket, MockWebSocket] {
    const a = new MockWebSocket();
    const b = new MockWebSocket();
    a.paired = b;
    b.paired = a;
    return [a, b];
}

(global as any).WebSocketPair = WebSocketPair;
