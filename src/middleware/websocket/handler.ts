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

import { match } from "path-to-regexp";
import { GET } from "../../constants/methods";
import { BadRequest, UpgradeRequired } from "../../errors";
import { Middleware } from "../../interfaces/middleware";
import { Worker } from "../../interfaces/worker";
import { hasConnectionHeader, hasUpgradeHeader, hasWebSocketVersion } from "./utils";

export class WebSocketHandler implements Middleware {
    constructor(private readonly path: string) {}

    public handle(worker: Worker, next: () => Promise<Response>): Promise<Response> {
        if (worker.request.method !== GET) {
            return next();
        }

        if (!this.isMatch(worker.request)) {
            return next();
        }

        const headers = worker.request.headers;
        if (!hasConnectionHeader(headers)) {
            return new BadRequest("Missing or invalid 'Connection' header").response();
        }
        if (!hasUpgradeHeader(headers)) {
            return new BadRequest("Missing or invalid 'Upgrade' header").response();
        }
        if (!hasWebSocketVersion(headers)) {
            return new UpgradeRequired().response();
        }

        return next();
    }

    private isMatch(request: Request): boolean {
        return match(this.path)(new URL(request.url).pathname) !== false;
    }
}
