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

import { WebSocketConnection } from "../interfaces/websocket";
import { NewConnectionBase } from "./new";
import { RestoredConnectionBase } from "./restore";

export class WebSocketSession {
    private readonly sessions = new Map<WebSocket, WebSocketConnection>();

    public create(): WebSocketConnection {
        return new WebSocketSession.NewConnection(this);
    }

    public restore(ws: WebSocket): WebSocketConnection {
        return new WebSocketSession.RestoredConnection(this, ws);
    }

    public lookup(ws: WebSocket): WebSocketConnection | undefined {
        return this.sessions.get(ws);
    }

    public all(): ReadonlyArray<WebSocketConnection> {
        return Array.from(this.sessions.values());
    }

    public close(ws: WebSocket, code?: number, reason?: string) {
        this.unregister(ws);
        ws.close(code, reason);
    }

    public *[Symbol.iterator](): IterableIterator<WebSocketConnection> {
        yield* this.sessions.values();
    }

    private register(ws: WebSocket, con: WebSocketConnection): void {
        this.sessions.set(ws, con);
    }

    private unregister(ws: WebSocket): boolean {
        return this.sessions.delete(ws);
    }

    private static readonly NewConnection = class extends NewConnectionBase {
        constructor(registry: WebSocketSession) {
            super();

            registry.register(this.server, this);
            this.addEventListener("close", () => registry.unregister(this.server));
        }
    };

    private static readonly RestoredConnection = class extends RestoredConnectionBase {
        constructor(registry: WebSocketSession, restore: WebSocket) {
            super(restore);

            registry.register(this.server, this);
            this.addEventListener("close", () => registry.unregister(this.server));
        }
    };
}
