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

import { isSendable } from "../../guards/websocket";
import { ServerWebSocketEvents } from "./server-events";
import { createWebSocketPair } from "./websocket";

export class ServerWebSocket extends ServerWebSocketEvents {
    private readonly _id = crypto.randomUUID();

    readonly #client: WebSocket;
    readonly #server: WebSocket;
    #accepted = false;

    constructor() {
        const [client, server] = createWebSocketPair();
        super(server);
        this.#client = client;
        this.#server = server;

        this.#server.addEventListener("close", this.onClose, { once: true });
    }

    public get id(): string | number {
        return this._id;
    }

    public accept(): WebSocket {
        this.#server.accept();
        this.#accepted = true;
        this.open();

        return this.#client;
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

        this.#server.send(data);
    }

    public close(code?: number, reason: string = ""): void {
        this.#server.removeEventListener("close", this.onClose);
        this.#server.close(code, reason);
    }

    private readonly onClose = (event: CloseEvent): void => {
        this.close(event.code, event.reason);
    };

    public get readyState(): number {
        if (!this.#accepted) return WebSocket.CONNECTING;
        return this.#server.readyState;
    }

    public isState(...states: number[]): boolean {
        return states.includes(this.readyState);
    }
}
