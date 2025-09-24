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
import { BasicWebSocket } from "./basic";

export class NewWebSocketConnection extends BasicWebSocket implements WebSocketConnection {
    private readonly _id: string;
    public readonly accept: () => WebSocket;
    public readonly acceptWebSocket: (ctx: DurableObjectState, tags?: string[]) => WebSocket;

    public constructor() {
        const pair = new WebSocketPair();
        const [client, server] = [pair[0], pair[1]];
        super(server);

        this._id = crypto.randomUUID();
        server.serializeAttachment(this.id);

        this.accept = (): WebSocket => {
            server.accept();
            this.accepted = true;
            this.open();

            return client;
        };

        this.acceptWebSocket = (ctx: DurableObjectState, tags?: string[]) => {
            ctx.acceptWebSocket(server, tags);
            this.accepted = true;
            this.open();

            return client;
        };
    }

    public get id(): string {
        return this._id;
    }
}
