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

import { GET, Method, OPTIONS } from "../constants";
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

export abstract class WebSocketWorker extends BasicWorker {
    private readonly client: WebSocket;
    private readonly server: WebSocket;

    constructor(_request: Request, _env: Env, _ctx: ExecutionContext) {
        super(_request, _env, _ctx);
        [this.client, this.server] = createWebSocketPair();
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

        this.addListeners();
        this.server.accept();
        return this.getResponse(WebSocketResponse, this.client);
    }

    private addListeners(): void {
        this.server.addEventListener("open", () => this.onOpen(), { once: true });
        this.server.addEventListener("message", this.doMessage, { once: false });
        this.server.addEventListener("error", this.doError, { once: false });
        this.server.addEventListener(
            "close",
            async (event: CloseEvent) => {
                await this.onClose(event);
                this.cleanup();
            },
            { once: true },
        );
    }

    private cleanup(): void {
        this.server.removeEventListener("message", this.doMessage);
        this.server.removeEventListener("error", this.doError);
    }

    private readonly doMessage = (event: MessageEvent): void => {
        if (isString(event.data)) {
            this.onMessage(event.data);
        } else if (isBinary(event.data)) {
            this.onBinary(toArrayBuffer(event.data));
        } else {
            console.warn("Unexpected data type in message");
        }
    };

    private readonly doError = (event: Event): void => {
        this.onError(event);
    };

    protected async onOpen(): Promise<void> {
        console.info("onOpen");
    }

    protected abstract onMessage(message: string): Promise<void>;

    protected async onBinary(_data: ArrayBuffer): Promise<void> {}

    protected async onError(event: Event): Promise<void> {
        console.error("onError", event);
    }

    protected async onClose(event: CloseEvent): Promise<void> {
        console.info("onClose", event);
    }

    protected send(data: string | ArrayBuffer | ArrayBufferView): void {
        this.server.send(data);
    }

    protected close(code?: number, reason?: string): void {
        this.server.close(code, reason);
    }

    protected get readyState(): number {
        return this.server.readyState;
    }

    public override getAllowedMethods(): Method[] {
        return [GET, OPTIONS];
    }
}
