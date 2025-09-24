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

import { safeCloseCode, safeReason } from "../guards/websocket";
import { WebSocketConnection } from "../interfaces/websocket";
import { NewConnectionBase } from "./new";
import { RestoredConnectionBase } from "./restore";

export class WebSocketSessions {
    private readonly map = new Map<WebSocket, WebSocketConnection>();

    public create(): WebSocketConnection {
        return new WebSocketSessions.NewConnection(this);
    }

    public restore(ws: WebSocket): WebSocketConnection {
        return new WebSocketSessions.RestoredConnection(this, ws);
    }

    public restoreAll(websockets: WebSocket[]): ReadonlyArray<WebSocketConnection> {
        const restored: WebSocketConnection[] = [];
        for (const ws of websockets) {
            restored.push(new WebSocketSessions.RestoredConnection(this, ws));
        }
        return restored;
    }

    public get(ws: WebSocket): WebSocketConnection | undefined {
        return this.map.get(ws);
    }

    public values(): IterableIterator<WebSocketConnection> {
        return this.map.values();
    }

    public keys(): IterableIterator<WebSocket> {
        return this.map.keys();
    }

    public close(ws: WebSocket, code?: number, reason?: string): boolean {
        ws.close(safeCloseCode(code), safeReason(reason));
        return this.unregister(ws);
    }

    public *[Symbol.iterator](): IterableIterator<WebSocketConnection> {
        yield* this.values();
    }

    private register(ws: WebSocket, con: WebSocketConnection): void {
        this.map.set(ws, con);
    }

    private unregister(ws: WebSocket): boolean {
        return this.map.delete(ws);
    }

    private static readonly NewConnection = class extends NewConnectionBase {
        constructor(sessions: WebSocketSessions) {
            super();

            sessions.register(this.server, this);
            this.addEventListener("close", () => sessions.unregister(this.server), { once: true });
        }
    };

    private static readonly RestoredConnection = class extends RestoredConnectionBase {
        constructor(sessions: WebSocketSessions, restore: WebSocket) {
            super(restore);

            sessions.register(this.server, this);
        }
    };
}
