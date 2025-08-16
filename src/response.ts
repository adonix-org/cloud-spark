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
import { getContentType, Method, MimeType } from "./common";

export interface CorsProvider {
    getAllowOrigin(): string;
    getAllowMethods(): Method[];
    getAllowHeaders(): string[];
}

export interface ErrorJson {
    code: number;
    error: string;
    details: string;
}

export class WorkerResponse {
    private _headers: Headers = new Headers();
    private _body: string | null;

    constructor(
        protected readonly cors: CorsProvider,
        content: string | null = null,
        protected readonly code: StatusCodes = StatusCodes.OK,
        protected readonly mimeType: MimeType = MimeType.JSON
    ) {
        this._body = this.code === StatusCodes.NO_CONTENT ? null : content;
    }

    public createResponse(): Response {
        this.addCorsHeaders();
        if (this.body) {
            this.headers.set("Content-Type", getContentType(this.mimeType));
        }
        return new Response(this.body, this.responseInit);
    }

    public get responseInit(): ResponseInit {
        return {
            headers: this.headers,
            status: this.code,
            statusText: getReasonPhrase(this.code),
        };
    }

    protected get body(): string | null {
        return this._body;
    }

    protected set body(body: string | null) {
        this._body = body;
    }

    protected get headers(): Headers {
        return this._headers;
    }

    protected set headers(headers: Headers) {
        this._headers = headers;
    }

    protected addCorsHeaders(): void {
        this.headers.set("Access-Control-Allow-Origin", this.getAllowOrigin());
        this.headers.set(
            "Access-Control-Allow-Headers",
            this.getAllowHeaders()
        );
        this.headers.set(
            "Access-Control-Allow-Methods",
            this.getAllowMethods()
        );
        this.headers.set("X-Content-Type-Options", "nosniff");
    }

    protected getAllowMethods(): string {
        return this.cors.getAllowMethods().join(", ");
    }

    protected getAllowHeaders(): string {
        return this.cors.getAllowHeaders().join(", ");
    }

    protected getAllowOrigin(): string {
        return this.cors.getAllowOrigin();
    }
}

export class JsonResponse extends WorkerResponse {
    private _json: object;
    constructor(
        cors: CorsProvider,
        content: object = {},
        code: StatusCodes = StatusCodes.OK
    ) {
        super(cors, null, code, MimeType.JSON);
        this._json = content;
    }

    public get json(): object {
        return this._json;
    }

    public set json(json: object) {
        this._json = json;
    }

    public override createResponse(): Response {
        this.body = JSON.stringify(this.json);
        return super.createResponse();
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
        this.headers.set("Allow", this.getAllowMethods());
    }
}

export class ErrorResponse extends JsonResponse {
    constructor(
        cors: CorsProvider,
        code: StatusCodes,
        protected details?: string
    ) {
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

export class BadRequest extends ErrorResponse {
    constructor(cors: CorsProvider, detail?: string) {
        super(cors, StatusCodes.BAD_REQUEST, detail);
    }
}

export class Unauthorized extends ErrorResponse {
    constructor(cors: CorsProvider, detail?: string) {
        super(cors, StatusCodes.UNAUTHORIZED, detail);
    }
}

export class Forbidden extends ErrorResponse {
    constructor(cors: CorsProvider, detail?: string) {
        super(cors, StatusCodes.FORBIDDEN, detail);
    }
}

export class NotFound extends ErrorResponse {
    constructor(cors: CorsProvider, detail?: string) {
        super(cors, StatusCodes.NOT_FOUND, detail);
    }
}

export class MethodNotAllowed extends ErrorResponse {
    constructor(cors: CorsProvider, method: string) {
        super(
            cors,
            StatusCodes.METHOD_NOT_ALLOWED,
            `${method} method not allowed.`
        );
        this.headers.set("Allow", this.getAllowMethods());
    }

    public override get json(): ErrorJson & { allowed: Method[] } {
        return {
            ...super.json,
            allowed: this.cors.getAllowMethods(),
        };
    }
}

export class InternalServerError extends ErrorResponse {
    constructor(cors: CorsProvider, detail?: string) {
        super(cors, StatusCodes.INTERNAL_SERVER_ERROR, detail);
    }
}

export class NotImplemented extends ErrorResponse {
    constructor(cors: CorsProvider) {
        super(cors, StatusCodes.NOT_IMPLEMENTED);
    }
}
