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

import { isSendable } from "../guards/websocket";

type WarnEvent = { type: "warn"; message: string };

export class ServerWebSocket {
    readonly #socket: WebSocket;
    readonly #openListeners: (() => void)[] = [];
    readonly #warnListeners: ((ev: WarnEvent) => void)[] = [];

    constructor(server: WebSocket) {
        this.#socket = server;
        this.#socket.addEventListener("close", this.#onClose, { once: true });
    }

    public accept() {
        this.#socket.accept();
        this.#openListeners.forEach((listener) => listener());
    }

    readonly #onClose = (event: CloseEvent): void => {
        this.close(event.code, event.reason);
    };

    protected warn(msg: string) {
        const ev: WarnEvent = { type: "warn", message: msg };
        this.#warnListeners.forEach((listener) => listener(ev));
    }

    public addEventListener(type: "warn", listener: (ev: WarnEvent) => void): void;
    public addEventListener(
        type: "open",
        listener: (ev: Event) => void,
        options?: { once?: boolean },
    ): void;
    public addEventListener<K extends keyof WebSocketEventMap>(
        type: K,
        listener: (ev: WebSocketEventMap[K]) => void,
        options?: { once?: boolean },
    ): void;

    // Implementation
    public addEventListener(
        type: keyof WebSocketEventMap | "warn",
        listener: (ev: any) => void,
        options?: { once?: boolean },
    ): void {
        if (type === "warn") {
            this.#warnListeners.push(listener as (ev: WarnEvent) => void);
        } else if (type === "open") {
            this.#openListeners.push(listener as () => void);
        } else {
            this.#socket.addEventListener(type, listener as any, options);
        }
    }

    public send(data: string | ArrayBuffer | ArrayBufferView): void {
        if (!this.isState(WebSocket.OPEN)) {
            this.warn("Cannot send: WebSocket not open");
            return;
        }
        if (!isSendable(data)) {
            this.warn("Cannot send: empty or invalid data");
            return;
        }
        this.#socket.send(data);
    }

    public close(code?: number, reason: string = ""): void {
        this.#socket.removeEventListener("close", this.#onClose);
        this.#socket.close(code, reason);
    }

    public get readyState(): number {
        return this.#socket.readyState;
    }

    public isState(...states: number[]): boolean {
        return states.includes(this.#socket.readyState);
    }
}
