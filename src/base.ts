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

import { getReasonPhrase, StatusCodes } from "http-status-codes";
import { isMethod, Method, MimeType } from "./constants";

export abstract class WorkerBase {
    constructor(
        protected readonly env: Env,
        protected readonly ctx?: ExecutionContext
    ) {}

    public async fetch(request: Request): Promise<Response> {
        if (!this.isAllowedMethod(request.method)) {
            return this.getResponse(StatusCodes.METHOD_NOT_ALLOWED);
        }

        try {
            switch (request.method) {
                case "GET":
                    return await this.get(request);
                case "PUT":
                    return await this.put(request);
                case "POST":
                    return await this.post(request);
                case "PATCH":
                    return await this.patch(request);
                case "DELETE":
                    return await this.post(request);
                case "HEAD":
                    return await this.head(request);
                case "OPTIONS":
                    return await this.options(request);
                default:
                    return this.getResponse(StatusCodes.METHOD_NOT_ALLOWED);
            }
        } catch (error) {
            return this.getResponse(
                StatusCodes.INTERNAL_SERVER_ERROR,
                this.getError(StatusCodes.INTERNAL_SERVER_ERROR, String(error))
            );
        }
    }

    protected async get(_request: Request): Promise<Response> {
        return this.getResponse(StatusCodes.NOT_IMPLEMENTED);
    }

    protected async put(_request: Request): Promise<Response> {
        return this.getResponse(StatusCodes.NOT_IMPLEMENTED);
    }

    protected async post(_request: Request): Promise<Response> {
        return this.getResponse(StatusCodes.NOT_IMPLEMENTED);
    }

    protected async patch(_request: Request): Promise<Response> {
        return this.getResponse(StatusCodes.NOT_IMPLEMENTED);
    }

    protected async delete(_request: Request): Promise<Response> {
        return this.getResponse(StatusCodes.NOT_IMPLEMENTED);
    }

    protected async options(_request: Request): Promise<Response> {
        return this.getResponse(StatusCodes.NO_CONTENT);
    }

    private async head(_request: Request): Promise<Response> {
        const response = await this.get(_request);
        return new Response(null, {
            headers: new Headers(response.headers),
            status: response.status,
            statusText: response.statusText,
        });
    }

    public getResponse(
        code: StatusCodes,
        init?: BodyInit | null,
        contentType: MimeType = MimeType.JSON
    ): Response {
        const headers = this.getHeaders();

        const body = code === StatusCodes.NO_CONTENT ? null : init;
        if (body) {
            headers.set("Content-Type", contentType);
        }

        return new Response(body, {
            status: code,
            statusText: getReasonPhrase(code),
            headers: this.addCorsHeaders(headers),
        });
    }

    protected getError(code: StatusCodes, message?: string): string {
        return JSON.stringify({
            code,
            error: message ?? getReasonPhrase(code),
        });
    }

    protected getAllowOrigin(): string {
        return "*";
    }

    protected getAllowMethods(): Method[] {
        return ["GET", "OPTIONS", "HEAD"];
    }

    private isAllowedMethod(method: string): boolean {
        return isMethod(method) && this.getAllowMethods().includes(method);
    }

    protected getAllowHeaders(): string[] {
        return ["Content-Type"];
    }

    protected getHeaders(): Headers {
        return new Headers({
            "X-Content-Type-Options": "nosniff",
        });
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
