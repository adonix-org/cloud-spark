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

import { GET } from "../../constants";
import { BadRequest, UpgradeRequired } from "../../errors";
import { Worker } from "../../interfaces";
import { Middleware } from "../middleware";
import { hasConnectionHeader, hasUpgradeHeader, hasWebSocketVersion } from "./utils";

export function websocket(path: string = "/"): Middleware {
    return new WebSocketHandler(path);
}

class WebSocketHandler extends Middleware {
    constructor(private readonly path: string) {
        super();
    }

    public handle(worker: Worker, next: () => Promise<Response>): Promise<Response> {
        if (worker.request.method !== GET) {
            return next();
        }

        if (this.getPath(worker.request) !== this.path) {
            return next();
        }

        const headers = worker.request.headers;
        if (!hasConnectionHeader(headers)) {
            return new BadRequest("Missing or invalid Connection header").getResponse();
        }
        if (!hasUpgradeHeader(headers)) {
            return new BadRequest("Missing or invalid Upgrade header").getResponse();
        }
        if (!hasWebSocketVersion(headers)) {
            return new UpgradeRequired().getResponse();
        }

        return next();
    }

    private getPath(request: Request): string {
        return new URL(request.url).pathname;
    }
}
