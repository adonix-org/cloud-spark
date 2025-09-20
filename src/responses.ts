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
import { CacheControl } from "./constants/cache";
import { setHeader, mergeHeader } from "./utils/header";
import { getContentType } from "./utils/response";
import { MediaType } from "./constants/media-types";
import { HttpHeader } from "./constants/http";

/**
 * Base class for building HTTP responses.
 * Manages headers, status, and media type.
 */
abstract class BaseResponse {
    /** HTTP headers for the response. */
    public headers: Headers = new Headers();

    /** HTTP status code (default 200 OK). */
    public status: StatusCodes = StatusCodes.OK;

    /** Optional status text. Defaults to standard reason phrase. */
    public statusText?: string;

    /** Enable websocket responses. */
    public webSocket: WebSocket | null = null;

    /** Default media type of the response body. */
    public mediaType: MediaType = MediaType.PLAIN_TEXT;

    /** Converts current state to ResponseInit for constructing a Response. */
    protected get responseInit(): ResponseInit {
        return {
            headers: this.headers,
            status: this.status,
            statusText: this.statusText ?? getReasonPhrase(this.status),
            webSocket: this.webSocket,
            encodeBody: "automatic",
        };
    }

    /** Sets a header, overwriting any existing value. */
    public setHeader(key: string, value: string | string[]): void {
        setHeader(this.headers, key, value);
    }

    /** Merges a header with existing values (does not overwrite). */
    public mergeHeader(key: string, value: string | string[]): void {
        mergeHeader(this.headers, key, value);
    }

    /** Adds a Content-Type header if not already existing (does not overwrite). */
    public addContentType() {
        if (!this.headers.get(HttpHeader.CONTENT_TYPE)) {
            this.headers.set(HttpHeader.CONTENT_TYPE, getContentType(this.mediaType));
        }
    }
}

/**
 * Base response class that adds caching headers.
 */
abstract class CacheResponse extends BaseResponse {
    constructor(public cache?: CacheControl) {
        super();
    }

    /** Adds Cache-Control header if caching is configured. */
    protected addCacheHeader(): void {
        if (this.cache) {
            this.headers.set(HttpHeader.CACHE_CONTROL, CacheControl.stringify(this.cache));
        }
    }
}

/**
 * Core worker response. Combines caching, and security headers.
 */
export abstract class WorkerResponse extends CacheResponse {
    constructor(
        private readonly body: BodyInit | null = null,
        cache?: CacheControl,
    ) {
        super(cache);
    }

    /** Builds the Response object with body, headers, and status. */
    public async getResponse(): Promise<Response> {
        this.addCacheHeader();

        const body = this.status === StatusCodes.NO_CONTENT ? null : this.body;

        if (body) this.addContentType();
        return new Response(body, this.responseInit);
    }
}

/**
 * Wraps an existing Response and clones its body, headers, and status.
 */
export class ClonedResponse extends WorkerResponse {
    constructor(response: Response, cache?: CacheControl) {
        const clone = response.clone();
        super(clone.body, cache);
        this.headers = new Headers(clone.headers);
        this.status = clone.status;
        this.statusText = clone.statusText;
    }
}

/**
 * Represents a successful response with customizable body, cache and status.
 */
export class SuccessResponse extends WorkerResponse {
    constructor(
        body: BodyInit | null = null,
        cache?: CacheControl,
        status: StatusCodes = StatusCodes.OK,
    ) {
        super(body, cache);
        this.status = status;
    }
}

/**
 * JSON response. Automatically sets Content-Type to application/json.
 */
export class JsonResponse extends SuccessResponse {
    constructor(json: unknown = {}, cache?: CacheControl, status: StatusCodes = StatusCodes.OK) {
        super(JSON.stringify(json), cache, status);
        this.mediaType = MediaType.JSON;
    }
}

/**
 * HTML response. Automatically sets Content-Type to text/html.
 */
export class HtmlResponse extends SuccessResponse {
    constructor(body: string, cache?: CacheControl, status: StatusCodes = StatusCodes.OK) {
        super(body, cache, status);
        this.mediaType = MediaType.HTML;
    }
}

/**
 * Plain text response. Automatically sets Content-Type to text/plain.
 */
export class TextResponse extends SuccessResponse {
    constructor(content: string, cache?: CacheControl, status: StatusCodes = StatusCodes.OK) {
        super(content, cache, status);
        this.mediaType = MediaType.PLAIN_TEXT;
    }
}

/**
 * Response for WebSocket upgrade requests.
 * Automatically sets status to 101 and attaches the client socket.
 */
export class WebSocketResponse extends WorkerResponse {
    constructor(client: WebSocket) {
        super(null);
        this.status = StatusCodes.SWITCHING_PROTOCOLS;
        this.webSocket = client;
    }
}

/**
 * Response for HEAD requests. Copy headers and status from a GET response
 * without the body.
 */
export class Head extends WorkerResponse {
    constructor(get: Response) {
        super();
        this.status = get.status;
        this.statusText = get.statusText;
        this.headers = new Headers(get.headers);
    }
}

/**
 * Response for OPTIONS preflight requests.
 */
export class Options extends SuccessResponse {
    constructor() {
        super(null, undefined, StatusCodes.NO_CONTENT);
    }
}
