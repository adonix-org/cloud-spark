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
import { isString } from "../guards/basic";
import { isBinary } from "../guards/websocket";
import { WebSocketResponse } from "../responses";
import {
    createWebSocketPair,
    hasConnectionHeader,
    hasUpgradeHeader,
    hasWebSocketVersion,
    toArrayBuffer,
} from "../utils/websocket";
import { BasicWorker } from "./basic-worker";
import { ServerWebSocket } from "./server-webocket";

export abstract class WebSocketWorker extends BasicWorker {
    readonly #client: WebSocket;
    readonly #server: WebSocket;
    public readonly ws: ServerWebSocket;

    constructor(_request: Request, _env: Env, _ctx: ExecutionContext) {
        super(_request, _env, _ctx);
        [this.#client, this.#server] = createWebSocketPair();
        this.ws = new ServerWebSocket(this.#server, this.warn);
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

        this.addEventListeners();

        this.#server.accept();
        this.ctx.waitUntil(this.onOpen());

        return this.getResponse(WebSocketResponse, this.#client);
    }

    private addEventListeners(): void {
        this.ws.addEventListener("message", this.doMessage);
        this.ws.addEventListener("error", this.doError);
        this.ws.addEventListener("close", this.doClose);
    }

    private readonly doMessage = (event: MessageEvent): void => {
        if (isString(event.data)) {
            this.ctx.waitUntil(this.onMessage(event.data));
        } else if (isBinary(event.data)) {
            this.ctx.waitUntil(this.onBinary(toArrayBuffer(event.data)));
        } else {
            this.warn("Unexpected data type in message");
        }
    };

    private readonly doError = (event: Event): void => {
        this.ctx.waitUntil(this.onError(event));
    };

    private readonly doClose = (event: CloseEvent): void => {
        this.ctx.waitUntil(this.onClose(event));
    };

    private readonly warn = (message: string): void => {
        this.ctx.waitUntil(this.onWarn(message));
    };

    protected async onOpen(): Promise<void> {}

    protected async onMessage(_message: string): Promise<void> {}

    protected async onBinary(_data: ArrayBuffer): Promise<void> {}

    protected async onWarn(_message: string): Promise<void> {}

    protected async onError(_event: Event): Promise<void> {}

    protected async onClose(_event: CloseEvent): Promise<void> {}

    public override getAllowedMethods(): Method[] {
        return [GET, OPTIONS];
    }
}
