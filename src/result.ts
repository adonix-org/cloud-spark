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

export interface ResponseProvider {
    get response(): Response;
}

export interface ErrorJson {
    code: number;
    error: string;
    details: string;
}

export class WorkerResult implements ResponseProvider {
    private _response?: Response;
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

    protected createResponse(): Response {
        this.addCorsHeaders();
        if (this.body) {
            this.headers.set("Content-Type", getContentType(this.mimeType));
        }
        return new Response(this.body, this.responseInit);
    }

    public get response(): Response {
        if (!this._response) {
            this._response = this.createResponse();
        }
        return this._response;
    }

    public get responseInit(): ResponseInit {
        return {
            headers: this.headers,
            status: this.code,
            statusText: getReasonPhrase(this.code),
        };
    }

    public get body(): string | null {
        return this._body;
    }

    public set body(body: string | null) {
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

export class JsonResult extends WorkerResult {
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

    protected override createResponse(): Response {
        this.body = JSON.stringify(this.json);
        return super.createResponse();
    }
}

/**
 * Remove the body from a GET response.
 */
export class Head extends WorkerResult {
    constructor(cors: CorsProvider, response: Response) {
        super(cors, null, response.status);
        this.headers = new Headers(response.headers);
    }
}

export class Options extends WorkerResult {
    constructor(cors: CorsProvider) {
        super(cors, null, StatusCodes.NO_CONTENT);
        this.headers.set("Allow", this.getAllowMethods());
    }
}

export class ErrorResult extends JsonResult {
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

export class NotImplemented extends ErrorResult {
    constructor(cors: CorsProvider) {
        super(cors, StatusCodes.NOT_IMPLEMENTED);
    }
}

export class InternalServerError extends ErrorResult {
    constructor(cors: CorsProvider, detail?: string) {
        super(cors, StatusCodes.INTERNAL_SERVER_ERROR, detail);
    }
}

export class MethodNotAllowed extends ErrorResult {
    constructor(cors: CorsProvider, method: string) {
        super(cors, StatusCodes.METHOD_NOT_ALLOWED);
        this.headers.set("Allow", this.getAllowMethods());
        this.details = `${method} method not allowed.`;
    }

    public override get json(): ErrorJson & { allowed: Method[] } {
        return {
            ...super.json,
            allowed: this.cors.getAllowMethods(),
        };
    }
}
