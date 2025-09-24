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
import { WebSocketAttachment } from "../interfaces/websocket";
import { EventWebSocket } from "./events";

export abstract class BasicWebSocket extends EventWebSocket {
    protected accepted = false;
    protected readonly server: WebSocket;

    constructor(server: WebSocket) {
        super(server);
        this.server = server;
        this.server.addEventListener("close", this.onClose, { once: true });
    }

    public get id(): string {
        return this.getAttachment().id;
    }

    public getAttachment<T extends WebSocketAttachment>(): T {
        return this.server.deserializeAttachment() as T;
    }

    public setAttachment<T extends WebSocketAttachment>(attachment: Partial<T>): void {
        const current = this.getAttachment<T>();
        this.server.serializeAttachment({ ...current, ...attachment });
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
        this.server.removeEventListener("close", this.onClose);
        this.server.close(code, reason);
    }

    public get readyState(): number {
        if (!this.accepted) return WebSocket.CONNECTING;
        return this.server.readyState;
    }

    public isState(...states: number[]): boolean {
        return states.includes(this.readyState);
    }

    private readonly onClose = (event: CloseEvent): void => {
        this.close(event.code, event.reason);
    };
}
