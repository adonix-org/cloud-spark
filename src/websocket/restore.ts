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
import { BaseWebSocket } from "./base";

export abstract class RestoredConnectionBase extends BaseWebSocket implements WebSocketConnection {
    constructor(ws: WebSocket) {
        super(ws);
        this.accepted = true;
    }

    public accept(): WebSocket {
        throw new Error("Do not call accept() on restore");
    }

    public acceptWebSocket(): WebSocket {
        throw new Error("Do not call acceptWebSocket() on restore");
    }
}
