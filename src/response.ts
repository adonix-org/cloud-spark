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

export class WorkerResponse {
    protected readonly headers: Headers;
    protected body: BodyInit | null;

    constructor(
        protected readonly cors: CorsProvider,
        protected readonly code: StatusCodes = StatusCodes.OK,
        protected readonly contentType: MimeType = MimeType.JSON,
        content: BodyInit | null = null
    ) {
        this.body = code === StatusCodes.NO_CONTENT ? null : content;
        this.headers = this.getHeaders();
    }

    public get response(): Response {
        return new Response(this.body, {
            status: this.code,
            statusText: getReasonPhrase(this.code),
            headers: this.headers,
        });
    }

    protected getHeaders(): Headers {
        const headers = new Headers({
            "Access-Control-Allow-Origin": this.getAllowOrigin(),
            "Access-Control-Allow-Headers": this.getAllowHeaders(),
            "Access-Control-Allow-Methods": this.getAllowMethods(),
            "X-Content-Type-Options": "nosniff",
        });
        if (this.body) {
            headers.set("Content-Type", this.contentType);
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

export class HeadResponse extends WorkerResponse {
    constructor(cors: CorsProvider, response: Response) {
        super(cors, response.status);
        this.headers.set("Allow", this.getAllowMethods());
    }
}

export class OptionsResponse extends WorkerResponse {
    constructor(cors: CorsProvider) {
        super(cors, StatusCodes.NO_CONTENT);
        this.headers.set("Allow", this.getAllowMethods());
    }
}

export class ErrorResponse extends WorkerResponse {
    constructor(
        cors: CorsProvider,
        code: StatusCodes,
        protected detail?: string
    ) {
        super(cors, code, MimeType.JSON);
    }

    public override get response(): Response {
        this.body = JSON.stringify({
            code: this.code,
            error: getReasonPhrase(this.code),
            detail: this.detail ?? getReasonPhrase(this.code),
        });
        return super.response;
    }
}

export class NotImplementedResponse extends ErrorResponse {
    constructor(cors: CorsProvider) {
        super(cors, StatusCodes.NOT_IMPLEMENTED);
    }
}

export class ServerErrorResponse extends ErrorResponse {
    constructor(cors: CorsProvider, detail?: string) {
        super(cors, StatusCodes.INTERNAL_SERVER_ERROR, detail);
    }
}

export class MethodNotAllowedResponse extends ErrorResponse {
    constructor(cors: CorsProvider) {
        super(cors, StatusCodes.METHOD_NOT_ALLOWED);
        this.headers.set("Allow", this.getAllowMethods());
        this.detail = `Allow: ${this.getAllowMethods()}`;
    }
}
