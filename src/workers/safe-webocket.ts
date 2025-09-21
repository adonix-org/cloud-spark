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

export class SafeWebSocket {
    readonly #socket: WebSocket;

    constructor(
        server: WebSocket,
        private readonly warn: (msg: string) => void = () => {},
    ) {
        this.#socket = server;
        this.#socket.addEventListener("close", this.onClose, { once: true });
    }

    private readonly onClose = (event: CloseEvent): void => {
        this.close(event.code, event.reason);
    };

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

    public close(code?: number, reason?: string): void {
        this.#socket.removeEventListener("close", this.onClose);

        if (this.isState(WebSocket.CLOSED)) {
            this.warn("Close called, but WebSocket is already closed");
            return;
        }
        this.#socket.close(code, reason);
    }

    public get readyState(): number {
        return this.#socket.readyState;
    }

    public isState(...states: number[]): boolean {
        return states.includes(this.#socket.readyState);
    }
}
