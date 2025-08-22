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
import { getContentType, mergeHeader, Method, MimeType, setHeader } from "./common";
import CacheControl from "cache-control-parser";

export interface CorsProvider {
    getOrigin(): string | null;
    getAllowOrigins(): string[];
    getAllowMethods(): Method[];
    getAllowHeaders(): string[];
    getExposeHeaders(): string[];
    getMaxAge(): number;
}

export interface ErrorJson {
    status: number;
    error: string;
    details: string;
}

abstract class BasicResponse {
    public headers: Headers = new Headers();
    public body: BodyInit | null;
    public status: StatusCodes = StatusCodes.OK;
    public statusText?: string;
    public mimeType?: MimeType;
    public cache?: CacheControl.CacheControl;

    constructor(content: BodyInit | null = null) {
        this.body = this.status === StatusCodes.NO_CONTENT ? null : content;
    }

    protected get responseInit(): ResponseInit {
        return {
            headers: this.headers,
            status: this.status,
            statusText: this.statusText ?? getReasonPhrase(this.status),
        };
    }

    public setHeader(key: string, value: string | string[]): void {
        setHeader(this.headers, key, value);
    }

    public mergeHeader(key: string, value: string | string[]): void {
        mergeHeader(this.headers, key, value);
    }
}

abstract class CorsResponse extends BasicResponse {
    constructor(public readonly cors: CorsProvider, content: BodyInit | null = null) {
        super(content);
    }

    protected addCorsHeaders(): void {
        const origin = this.cors.getOrigin();
        if (!origin) return; // no Origin, skip CORS

        this.headers.delete("Access-Control-Allow-Origin");

        const allowed = this.cors.getAllowOrigins();
        if (allowed.includes("*")) {
            this.setHeader("Access-Control-Allow-Origin", "*");
        } else if (allowed.includes(origin)) {
            this.setHeader("Access-Control-Allow-Origin", origin);
            this.setHeader("Access-Control-Allow-Credentials", "true");
            this.mergeHeader("Vary", "Origin");
        }

        this.mergeHeader("Access-Control-Expose-Headers", this.cors.getExposeHeaders());
        this.setHeader("Access-Control-Allow-Headers", this.cors.getAllowHeaders());
        this.setHeader("Access-Control-Allow-Methods", this.cors.getAllowMethods());
        this.setHeader("Access-Control-Max-Age", String(this.cors.getMaxAge()));
        this.setHeader("X-Content-Type-Options", "nosniff");
    }
}

export abstract class WorkerResponse extends CorsResponse {
    constructor(
        cors: CorsProvider,
        content: BodyInit | null = null,
        cache?: CacheControl.CacheControl
    ) {
        super(cors, content);
        this.cache = cache;
    }

    public createResponse(): Response {
        this.addCorsHeaders();
        if (this.body && this.mimeType) {
            this.headers.set("Content-Type", getContentType(this.mimeType));
        }
        if (this.cache) {
            this.headers.set("Cache-Control", CacheControl.stringify(this.cache));
        }
        return new Response(this.body, this.responseInit);
    }
}

export class ClonedResponse extends WorkerResponse {
    constructor(cors: CorsProvider, response: Response, cache?: CacheControl.CacheControl) {
        super(cors, response.body);
        this.headers = new Headers(response.headers);
        this.status = response.status;
        this.cache = cache;
    }
}

export class JsonResponse extends WorkerResponse {
    constructor(
        cors: CorsProvider,
        json: object = {},
        status: StatusCodes = StatusCodes.OK,
        cache?: CacheControl.CacheControl
    ) {
        super(cors), JSON.stringify(json);
        this.status = status;
        this.mimeType = MimeType.JSON;
        this.cache = cache;
    }
}

export class HtmlResponse extends WorkerResponse {
    constructor(cors: CorsProvider, content: string, cache?: CacheControl.CacheControl) {
        super(cors, content);
        this.mimeType = MimeType.HTML;
        this.cache = cache;
    }
}

export class TextResponse extends WorkerResponse {
    constructor(cors: CorsProvider, content: string, cache?: CacheControl.CacheControl) {
        super(cors, content);
        this.mimeType = MimeType.PLAIN_TEXT;
        this.cache = cache;
    }
}

/**
 * Remove the body from a GET response.
 */
export class Head extends WorkerResponse {
    constructor(cors: CorsProvider, response: Response) {
        super(cors, null);
        this.headers = new Headers(response.headers);
    }
}

export class Options extends WorkerResponse {
    constructor(cors: CorsProvider) {
        super(cors, null);
        this.status = StatusCodes.NO_CONTENT;
        this.setHeader("Allow", this.cors.getAllowMethods());
    }
}

export class HttpError extends JsonResponse {
    constructor(cors: CorsProvider, status: StatusCodes, protected readonly details?: string) {
        super(cors, {}, status);
        this.cache = {
            "no-store": true,
            "no-cache": true,
            "must-revalidate": true,
        };
    }

    public get json(): ErrorJson {
        return {
            status: this.status,
            error: getReasonPhrase(this.status),
            details: this.details ?? getReasonPhrase(this.status),
        };
    }

    public override createResponse(): Response {
        this.body = JSON.stringify(this.json);
        return super.createResponse();
    }
}

export class BadRequest extends HttpError {
    constructor(cors: CorsProvider, detail?: string) {
        super(cors, StatusCodes.BAD_REQUEST, detail);
    }
}

export class Unauthorized extends HttpError {
    constructor(cors: CorsProvider, detail?: string) {
        super(cors, StatusCodes.UNAUTHORIZED, detail);
    }
}

export class Forbidden extends HttpError {
    constructor(cors: CorsProvider, detail?: string) {
        super(cors, StatusCodes.FORBIDDEN, detail);
    }
}

export class NotFound extends HttpError {
    constructor(cors: CorsProvider, detail?: string) {
        super(cors, StatusCodes.NOT_FOUND, detail);
    }
}

export class MethodNotAllowed extends HttpError {
    constructor(cors: CorsProvider, method: string) {
        super(cors, StatusCodes.METHOD_NOT_ALLOWED, `${method} method not allowed.`);
        this.setHeader("Allow", this.cors.getAllowMethods());
    }

    public override get json(): ErrorJson & { allowed: Method[] } {
        return {
            ...super.json,
            allowed: this.cors.getAllowMethods(),
        };
    }
}

export class InternalServerError extends HttpError {
    constructor(cors: CorsProvider, detail?: string) {
        super(cors, StatusCodes.INTERNAL_SERVER_ERROR, detail);
    }
}

export class NotImplemented extends HttpError {
    constructor(cors: CorsProvider) {
        super(cors, StatusCodes.NOT_IMPLEMENTED);
    }
}

export class ServiceUnavailable extends HttpError {
    constructor(cors: CorsProvider, detail?: string) {
        super(cors, StatusCodes.SERVICE_UNAVAILABLE, detail);
    }
}
