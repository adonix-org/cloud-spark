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
import { CorsProvider, MimeType } from "./common";

export interface ResponseProvider {
    get response(): Response;
}

export class WorkerResult implements ResponseProvider {
    private _response?: Response;
    protected headers: Headers;
    protected body: BodyInit | null;

    constructor(
        protected readonly cors: CorsProvider,
        protected readonly code: StatusCodes = StatusCodes.OK,
        content: BodyInit | null = null,
        protected readonly mimeType: MimeType = MimeType.JSON
    ) {
        this.body = this.code === StatusCodes.NO_CONTENT ? null : content;
        this.headers = this.getHeaders();
    }

    protected createResponse(): Response {
        return new Response(this.body, {
            status: this.code,
            statusText: getReasonPhrase(this.code),
            headers: this.headers,
        });
    }

    public get response(): Response {
        if (!this._response) {
            this._response = this.createResponse();
        }
        return this._response;
    }

    protected getHeaders(): Headers {
        const headers = new Headers({
            "Access-Control-Allow-Origin": this.getAllowOrigin(),
            "Access-Control-Allow-Headers": this.getAllowHeaders(),
            "Access-Control-Allow-Methods": this.getAllowMethods(),
            "X-Content-Type-Options": "nosniff",
        });
        if (this.body) {
            headers.set("Content-Type", this.mimeType);
        }
        return headers;
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

/**
 * Takes a GET response and removes the body.
 */
export class Head extends WorkerResult {
    constructor(cors: CorsProvider, response: Response) {
        super(cors, response.status);
        this.headers = new Headers(response.headers);
    }
}

export class Options extends WorkerResult {
    constructor(cors: CorsProvider) {
        super(cors, StatusCodes.NO_CONTENT);
        this.headers.set("Allow", this.getAllowMethods());
    }
}

export class ErrorResult extends WorkerResult {
    constructor(
        cors: CorsProvider,
        code: StatusCodes,
        protected detail?: string
    ) {
        super(cors, code, MimeType.JSON);
    }

    protected override createResponse(): Response {
        this.body = JSON.stringify({
            code: this.code,
            error: getReasonPhrase(this.code),
            detail: this.detail ?? getReasonPhrase(this.code),
        });
        return super.createResponse();
    }
}

export class NotImplemented extends ErrorResult {
    constructor(cors: CorsProvider) {
        super(cors, StatusCodes.NOT_IMPLEMENTED);
    }
}

export class InternalSeverError extends ErrorResult {
    constructor(cors: CorsProvider, detail?: string) {
        super(cors, StatusCodes.INTERNAL_SERVER_ERROR, detail);
    }
}

export class MethodNotAllowed extends ErrorResult {
    constructor(cors: CorsProvider) {
        super(cors, StatusCodes.METHOD_NOT_ALLOWED);
        this.headers.set("Allow", this.getAllowMethods());
        this.detail = `Allow: ${this.getAllowMethods()}`;
    }
}
