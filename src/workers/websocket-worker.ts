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

import { Method, GET, OPTIONS } from "../constants";
import { BadRequest, UpgradeRequired } from "../errors";
import { WebSocketResponse } from "../responses";
import {
    hasConnectionHeader,
    hasUpgradeHeader,
    hasWebSocketVersion,
} from "../utils/websocket/websocket";
import { BasicWorker } from "./basic-worker";
import { ServerWebSocket } from "../utils/websocket/server-webocket";

export abstract class WebSocketWorker extends BasicWorker {
    public readonly ws: ServerWebSocket;

    constructor(_request: Request, _env: Env, _ctx: ExecutionContext) {
        super(_request, _env, _ctx);
        this.ws = new ServerWebSocket();
    }

    protected override async get(): Promise<Response> {
        const headers = this.request.headers;
        if (!hasConnectionHeader(headers)) {
            return this.getResponse(BadRequest, "Missing or invalid Connection header");
        }
        if (!hasUpgradeHeader(headers)) {
            return this.getResponse(BadRequest, "Missing or invalid Upgrade header");
        }
        if (!hasWebSocketVersion(headers)) {
            return this.getResponse(UpgradeRequired);
        }

        return this.getResponse(WebSocketResponse, this.ws.accept());
    }

    public override getAllowedMethods(): Method[] {
        return [GET, OPTIONS];
    }
}
