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

import { WebSocketConnection, WSAttachment } from "../interfaces/websocket";

import { BaseWebSocket } from "./base";

/**
 * Internal base for a WebSocket connection that has already been restored.
 *
 * - Marks the connection as accepted immediately upon construction.
 * - Overrides acceptance methods to prevent re-accepting an already-active WebSocket.
 * - Throws an error if `accept()` or `acceptWebSocket()` is called.
 *
 * @template A - Type of the attachment object for this connection.
 */
export abstract class RestoredConnectionBase<A extends WSAttachment>
    extends BaseWebSocket<A>
    implements WebSocketConnection<A>
{
    constructor(ws: WebSocket) {
        super(ws);
        this.accepted = true;
    }

    /** Not supported for restored connections; throws an error. */
    public accept(): Readonly<WebSocket> {
        throw new Error("Do not call accept() on restore");
    }

    /** Not supported for restored connections; throws an error. */
    public acceptWebSocket(): Readonly<WebSocket> {
        throw new Error("Do not call acceptWebSocket() on restore");
    }
}
