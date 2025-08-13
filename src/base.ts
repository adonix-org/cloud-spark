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

import { ContentType } from "content-types-lite";
import { getReasonPhrase, StatusCodes } from "http-status-codes";
import { Method } from "./methods";

export abstract class WorkerBase {
    constructor(
        protected readonly env: Env,
        protected readonly ctx: ExecutionContext
    ) {}

    public async fetch(request: Request): Promise<Response> {
        switch (request.method) {
            case "OPTIONS":
                return await this.options(request);
            case "GET":
                return await this.get(request);
            default:
                return this.getResponse(StatusCodes.BAD_REQUEST, "");
        }
        return new Response();
    }

    protected async get(_request: Request): Promise<Response> {
        return this.getResponse(StatusCodes.NOT_IMPLEMENTED);
    }

    protected async head(_request: Request): Promise<Response> {
        return this.get(_request);
    }

    protected async options(_request: Request): Promise<Response> {
        return this.getResponse(StatusCodes.NO_CONTENT);
    }

    public getResponse(
        code: StatusCodes,
        body: string | null = null,
        contentType: ContentType = "JSON"
    ) {
        const headers = new Headers({
            // TODO: figure out what to do with Cache-Control
            // "Cache-Control": "public, max-age=86400, immutable",
            "X-Content-Type-Options": "nosniff",
        });

        if (body) {
            const bodyBytes = new TextEncoder().encode(body);
            headers.set("Content-Type", contentType);
            headers.set("Content-Length", bodyBytes.length.toString());
        }

        return new Response(body, {
            status: code,
            statusText: getReasonPhrase(code),
            headers: this.addCorsHeaders(headers),
        });
    }

    protected getAllowOrigin(): string {
        return "*";
    }

    protected getAllowMethods(): Method[] {
        return ["GET", "OPTIONS", "HEAD"];
    }

    protected getAllowHeaders(): string[] {
        return ["Content-Type"];
    }

    private addCorsHeaders(headers: Headers): Headers {
        headers.set("Access-Control-Allow-Origin", this.getAllowOrigin());
        headers.set(
            "Access-Control-Allow-Headers",
            this.getAllowHeaders().join(". ")
        );
        headers.set(
            "Access-Control-Allow-Methods",
            this.getAllowMethods().join(", ")
        );
        return headers;
    }
}
