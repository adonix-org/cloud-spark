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

import { WebSocketConnection } from "./connection";

export class WebSocketRegistry {
    private readonly registry = new Map<WebSocket, WebSocketConnection>();

    public create(): WebSocketConnection {
        return new WebSocketConnection(this);
    }

    public restore(ws: WebSocket): WebSocketConnection {
        return new WebSocketConnection(this, ws);
    }

    public lookup(ws: WebSocket): WebSocketConnection | undefined {
        return this.registry.get(ws);
    }

    public all(): ReadonlyArray<WebSocketConnection> {
        return Array.from(this.registry.values());
    }

    public close(ws: WebSocket, code?: number, reason?: string) {
        this.unregister(ws);
        ws.close(code, reason);
    }

    public register(ws: WebSocket, con: WebSocketConnection) {
        this.registry.set(ws, con);
    }

    public unregister(ws: WebSocket) {
        this.registry.delete(ws);
    }
}
