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

export interface CorsProvider {
    getOrigin(): string | null;
    getAllowOrigins(): string[];
    getAllowMethods(): Method[];
    getAllowHeaders(): string[];
    getExposeHeaders(): string[];
    getMaxAge(): number;
}

export interface ErrorJson {
    code: number;
    error: string;
    details: string;
}

class BasicResponse {
    private _headers: Headers = new Headers();
    private _body: BodyInit | null;

    constructor(
        content: BodyInit | null = null,
        protected readonly code: StatusCodes = StatusCodes.OK,
        protected readonly mimeType: MimeType = MimeType.JSON
    ) {
        this._body = this.code === StatusCodes.NO_CONTENT ? null : content;
    }

    protected get responseInit(): ResponseInit {
        return {
            headers: this.headers,
            status: this.code,
            statusText: getReasonPhrase(this.code),
        };
    }

    protected get body(): BodyInit | null {
        return this._body;
    }

    protected get headers(): Headers {
        return this._headers;
    }

    protected set headers(headers: Headers) {
        this._headers = headers;
    }

    protected setHeader(key: string, value: string | string[]): void {
        setHeader(this.headers, key, value);
    }

    protected mergeHeader(key: string, value: string | string[]): void {
        mergeHeader(this.headers, key, value);
    }
}

class CorsResponse extends BasicResponse {
    constructor(
        protected readonly cors: CorsProvider,
        content: BodyInit | null = null,
        code: StatusCodes = StatusCodes.OK,
        mimeType: MimeType = MimeType.JSON
    ) {
        super(content, code, mimeType);
    }

    protected addCorsHeaders(): void {
        const origin = this.cors.getOrigin();
        if (!origin) return; // no Origin, skip CORS

        this.headers.delete("Access-Control-Allow-Origin");
        if (this.cors.getAllowOrigins().includes("*")) {
            this.setHeader("Access-Control-Allow-Origin", "*");
        } else if (this.cors.getAllowOrigins().includes(origin)) {
            this.setHeader("Access-Control-Allow-Origin", origin);
            this.setHeader("Access-Control-Allow-Credentials", "true");
            this.mergeHeader("Vary", ["Origin", "Origin", "Origin", "     ", "Content-Type"]);
            this.mergeHeader("Vary", "Origin");
        }
        this.mergeHeader("Access-Control-Expose-Headers", this.cors.getExposeHeaders());
        this.setHeader("Access-Control-Allow-Headers", this.cors.getAllowHeaders());
        this.setHeader("Access-Control-Allow-Methods", this.cors.getAllowMethods());
        this.setHeader("Access-Control-Max-Age", String(this.cors.getMaxAge()));
        this.setHeader("X-Content-Type-Options", "nosniff");
    }
}

export class WorkerResponse extends CorsResponse {
    public createResponse(): Response {
        this.addCorsHeaders();
        if (this.body) {
            this.headers.set("Content-Type", getContentType(this.mimeType));
        }
        return new Response(this.body, this.responseInit);
    }
}

export class ClonedResponse extends WorkerResponse {
    constructor(cors: CorsProvider, response: Response) {
        super(cors, response.body, response.status);
        this.headers = new Headers(response.headers);
    }
}

export class JsonResponse extends WorkerResponse {
    private _json: object;
    constructor(cors: CorsProvider, content: object = {}, code: StatusCodes = StatusCodes.OK) {
        super(cors, null, code, MimeType.JSON);
        this._json = content;
    }

    public get json(): object {
        return this._json;
    }

    public set json(json: object) {
        this._json = json;
    }

    protected override get body(): string {
        return JSON.stringify(this.json);
    }
}

export class HtmlResponse extends WorkerResponse {
    constructor(
        cors: CorsProvider,
        content: string,
        code: StatusCodes = StatusCodes.OK,
        type: MimeType = MimeType.HTML
    ) {
        super(cors, content, code, type);
    }
}

export class TextResponse extends WorkerResponse {
    constructor(
        cors: CorsProvider,
        content: string,
        code: StatusCodes = StatusCodes.OK,
        type: MimeType = MimeType.PLAIN_TEXT
    ) {
        super(cors, content, code, type);
    }
}

/**
 * Remove the body from a GET response.
 */
export class Head extends WorkerResponse {
    constructor(cors: CorsProvider, response: Response) {
        super(cors, null, response.status);
        this.headers = new Headers(response.headers);
    }
}

export class Options extends WorkerResponse {
    constructor(cors: CorsProvider) {
        super(cors, null, StatusCodes.NO_CONTENT);
        this.setHeader("Allow", this.cors.getAllowMethods());
    }
}

export class HttpError extends JsonResponse {
    constructor(cors: CorsProvider, code: StatusCodes, protected details?: string) {
        super(cors, {}, code);
    }

    public override get json(): ErrorJson {
        return {
            code: this.code,
            error: getReasonPhrase(this.code),
            details: this.details ?? getReasonPhrase(this.code),
        };
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
