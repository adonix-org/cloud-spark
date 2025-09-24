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

import { isSendable, safeCloseCode } from "../guards/websocket";
import { WebSocketEvents } from "./events";

export abstract class BasicWebSocket extends WebSocketEvents {
    protected accepted = false;
    protected readonly server: WebSocket;

    constructor(server: WebSocket) {
        super(server);
        this.server = server;
        this.server.addEventListener("close", this.onclose, { once: true });
    }

    public getAttachment<T extends object>(): T {
        return this.server.deserializeAttachment() as T;
    }

    public setAttachment<T extends object>(attachment: T): void {
        this.server.serializeAttachment(attachment);
    }

    public send(data: string | ArrayBuffer | ArrayBufferView): void {
        if (this.isState(WebSocket.CONNECTING, WebSocket.CLOSED)) {
            this.warn("Cannot send: WebSocket not open");
            return;
        }
        if (!isSendable(data)) {
            this.warn("Cannot send: empty or invalid data");
            return;
        }

        this.server.send(data);
    }

    public close(code?: number, reason?: string): void {
        this.server.removeEventListener("close", this.onclose);
        this.server.close(safeCloseCode(code), reason);
    }

    public get readyState(): number {
        if (!this.accepted) return WebSocket.CONNECTING;
        return this.server.readyState;
    }

    public isState(...states: number[]): boolean {
        return states.includes(this.readyState);
    }

    private readonly onclose = (event: CloseEvent): void => {
        this.close(event.code, event.reason);
    };
}
