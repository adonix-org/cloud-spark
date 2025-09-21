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
import { isSendable, isBinary } from "../guards/websocket";
import { WebSocketResponse } from "../responses";
import {
    createWebSocketPair,
    hasConnectionHeader,
    hasUpgradeHeader,
    hasWebSocketVersion,
    toArrayBuffer,
} from "../utils/websocket";
import { BasicWorker } from "./basic-worker";

export abstract class WebSocketWorker extends BasicWorker {
    readonly #client: WebSocket;
    readonly #server: WebSocket;
    public readonly ws: SafeWebSocket;

    constructor(_request: Request, _env: Env, _ctx: ExecutionContext) {
        super(_request, _env, _ctx);
        [this.#client, this.#server] = createWebSocketPair();
        this.ws = new SafeWebSocket(this.#server, this.warn);
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
        this.#server.addEventListener("message", this.doMessage);
        this.#server.addEventListener("error", this.doError);
        this.#server.addEventListener("close", this.doClose);
    }

    private removeEventListeners(): void {
        this.#server.removeEventListener("message", this.doMessage);
        this.#server.removeEventListener("error", this.doError);
        this.#server.removeEventListener("close", this.doClose);
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
        this.removeEventListeners();
        this.ws.close(event.code, event.reason);
        this.ctx.waitUntil(this.onClose(event));
    };

    private warn(message: string): void {
        this.ctx.waitUntil(this.onWarn(message));
    }

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

class SafeWebSocket {
    readonly #socket: WebSocket;

    constructor(
        websocket: WebSocket,
        private readonly onWarn: (msg: string) => void = () => {},
    ) {
        this.#socket = websocket;
    }

    public send(data: string | ArrayBuffer | ArrayBufferView): void {
        if (!this.isState(WebSocket.OPEN)) {
            this.onWarn("Cannot send: WebSocket not open");
            return;
        }
        if (!isSendable(data)) {
            this.onWarn("Cannot send: empty or invalid data");
            return;
        }
        this.#socket.send(data);
    }

    public close(code?: number, reason?: string): void {
        if (this.isState(WebSocket.CLOSED)) {
            this.onWarn("Close called, but WebSocket is already closing or closed");
            return;
        }

        this.#socket.close(code, reason);
    }

    public get readyState(): number {
        return this.#socket.readyState;
    }

    public isState(...states: number[]): boolean {
        return states.includes(this.#socket.readyState);
    }
}
