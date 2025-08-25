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
import {
    CacheControl,
    getContentType,
    HttpHeader,
    mergeHeader,
    Method,
    MimeType,
    setHeader,
} from "./common";
import { Cors, CorsProvider } from "./cors";

export interface ErrorJson {
    status: number;
    error: string;
    details: string;
}

abstract class BaseResponse {
    public headers: Headers = new Headers();
    public body: BodyInit | null;
    public status: StatusCodes = StatusCodes.OK;
    public statusText?: string;
    public mimeType?: MimeType;
    public cache?: CacheControl;

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

    public addContentType() {
        if (this.mimeType) {
            this.headers.set("Content-Type", getContentType(this.mimeType));
        }
    }

    public addCacheControl() {
        if (this.cache) {
            this.headers.set("Cache-Control", CacheControl.stringify(this.cache));
        }
    }
}

abstract class CorsResponse extends BaseResponse {
    constructor(public readonly cors: CorsProvider, content: BodyInit | null = null) {
        super(content);
    }

    protected addCorsHeaders(): void {
        const origin = this.cors.getOrigin();
        if (!origin) return; // no Origin, skip CORS

        this.headers.delete(Cors.ALLOW_ORIGIN);
        this.headers.delete(Cors.ALLOW_CREDENTIALS);

        const allowed = this.cors.getAllowOrigins();
        if (allowed.includes(Cors.ALLOW_ALL_ORIGINS)) {
            this.setHeader(Cors.ALLOW_ORIGIN, Cors.ALLOW_ALL_ORIGINS);
        } else if (allowed.includes(origin)) {
            this.setHeader(Cors.ALLOW_ORIGIN, origin);
            this.setHeader(Cors.ALLOW_CREDENTIALS, String(true));
            this.mergeHeader(HttpHeader.VARY, HttpHeader.ORIGIN);
        }

        this.mergeHeader(Cors.EXPOSE_HEADERS, this.cors.getExposeHeaders());
        this.setHeader(Cors.ALLOW_HEADERS, this.cors.getAllowHeaders());
        this.setHeader(Cors.ALLOW_METHODS, this.cors.getAllowMethods());
        this.setHeader(Cors.MAX_AGE, String(this.cors.getMaxAge()));
    }
}

export abstract class WorkerResponse extends CorsResponse {
    constructor(cors: CorsProvider, body: BodyInit | null = null, cache?: CacheControl) {
        super(cors, body);
        this.cache = cache;
    }

    public createResponse(): Response {
        this.addCorsHeaders();
        this.addCacheControl();

        this.setHeader(HttpHeader.X_CONTENT_TYPE_OPTIONS, HttpHeader.NOSNIFF);

        const body = this.status === StatusCodes.NO_CONTENT ? null : this.body;
        if (body) this.addContentType();
        return new Response(body, this.responseInit);
    }
}

export class ClonedResponse extends WorkerResponse {
    constructor(cors: CorsProvider, response: Response, cache?: CacheControl) {
        const clone = response.clone();
        super(cors, clone.body, cache);
        this.headers = new Headers(clone.headers);
        this.status = clone.status;
        this.statusText = clone.statusText;
    }
}

export class SuccessResponse extends WorkerResponse {
    constructor(
        cors: CorsProvider,
        body: BodyInit | null = null,
        cache?: CacheControl,
        status: StatusCodes = StatusCodes.OK
    ) {
        super(cors, body, cache);
        this.status = status;
    }
}

export class JsonResponse extends SuccessResponse {
    constructor(
        cors: CorsProvider,
        json: unknown = {},
        cache?: CacheControl,
        status: StatusCodes = StatusCodes.OK
    ) {
        super(cors, JSON.stringify(json), cache, status);
        this.mimeType = MimeType.JSON;
    }
}

export class HtmlResponse extends SuccessResponse {
    constructor(
        cors: CorsProvider,
        body: string,
        cache?: CacheControl,
        status: StatusCodes = StatusCodes.OK
    ) {
        super(cors, body, cache, status);
        this.mimeType = MimeType.HTML;
    }
}

export class TextResponse extends SuccessResponse {
    constructor(
        cors: CorsProvider,
        content: string,
        cache?: CacheControl,
        status: StatusCodes = StatusCodes.OK
    ) {
        super(cors, content, cache, status);
        this.mimeType = MimeType.PLAIN_TEXT;
    }
}

/**
 * Remove the body from a GET response.
 */
export class Head extends WorkerResponse {
    constructor(cors: CorsProvider, get: Response) {
        super(cors);
        this.headers = new Headers(get.headers);
    }
}

export class Options extends SuccessResponse {
    constructor(cors: CorsProvider) {
        super(cors, null, undefined, StatusCodes.NO_CONTENT);
        this.setHeader("Allow", this.cors.getAllowMethods());
    }
}

export class HttpError extends JsonResponse {
    constructor(cors: CorsProvider, status: StatusCodes, protected readonly details?: string) {
        const cache: CacheControl = {
            "no-cache": true,
            "no-store": true,
            "must-revalidate": true,
            "max-age": 0,
        };
        super(cors, undefined, cache, status);
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
    constructor(cors: CorsProvider, details?: string) {
        super(cors, StatusCodes.BAD_REQUEST, details);
    }
}

export class Unauthorized extends HttpError {
    constructor(cors: CorsProvider, details?: string) {
        super(cors, StatusCodes.UNAUTHORIZED, details);
    }
}

export class Forbidden extends HttpError {
    constructor(cors: CorsProvider, details?: string) {
        super(cors, StatusCodes.FORBIDDEN, details);
    }
}

export class NotFound extends HttpError {
    constructor(cors: CorsProvider, details?: string) {
        super(cors, StatusCodes.NOT_FOUND, details);
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
    constructor(cors: CorsProvider, details?: string) {
        super(cors, StatusCodes.INTERNAL_SERVER_ERROR, details);
    }
}

export class NotImplemented extends HttpError {
    constructor(cors: CorsProvider) {
        super(cors, StatusCodes.NOT_IMPLEMENTED);
    }
}

export class ServiceUnavailable extends HttpError {
    constructor(cors: CorsProvider, details?: string) {
        super(cors, StatusCodes.SERVICE_UNAVAILABLE, details);
    }
}
