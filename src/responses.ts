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
import { setHeader, mergeHeader, filterHeaders } from "./utils/headers";
import { UTF8_CHARSET, MediaType } from "./constants/media";
import { FORBIDDEN_204_HEADERS, FORBIDDEN_304_HEADERS, HttpHeader } from "./constants/headers";
import { OctetStreamInit } from "./interfaces/response";
import { withCharset } from "./utils/media";

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
    public mediaType: string = withCharset(MediaType.PLAIN_TEXT, UTF8_CHARSET);

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
            this.setHeader(HttpHeader.CONTENT_TYPE, this.mediaType);
        }
    }

    /**
     * Removes headers that are disallowed or discouraged based on the current
     * status code.
     *
     * - **204 No Content:** strips headers that "should not" be sent
     *   (`Content-Length`, `Content-Range`), per the HTTP spec.
     * - **304 Not Modified:** strips headers that "must not" be sent
     *   (`Content-Type`, `Content-Length`, `Content-Range`, etc.), per the HTTP spec.
     *
     * This ensures that responses remain compliant with HTTP/1.1 standards while preserving
     * custom headers that are allowed.
     */
    public filterHeaders(): void {
        if (this.status === StatusCodes.NO_CONTENT) {
            filterHeaders(this.headers, FORBIDDEN_204_HEADERS);
        } else if (this.status === StatusCodes.NOT_MODIFIED) {
            filterHeaders(this.headers, FORBIDDEN_304_HEADERS);
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
            this.setHeader(HttpHeader.CACHE_CONTROL, CacheControl.stringify(this.cache));
        }
    }
}

/**
 * Core response. Combines caching, and content type headers.
 */
export abstract class WorkerResponse extends CacheResponse {
    constructor(
        private readonly body: BodyInit | null = null,
        cache?: CacheControl,
    ) {
        super(cache);
    }

    /** Builds the Response with body, headers, and status. */
    public async response(): Promise<Response> {
        this.addCacheHeader();

        const body = [StatusCodes.NO_CONTENT, StatusCodes.NOT_MODIFIED].includes(this.status)
            ? null
            : this.body;

        if (body) this.addContentType();

        this.filterHeaders();

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
        this.mediaType = withCharset(MediaType.JSON, UTF8_CHARSET);
    }
}

/**
 * HTML response. Automatically sets Content-Type to text/html.
 */
export class HtmlResponse extends SuccessResponse {
    constructor(
        body: string,
        cache?: CacheControl,
        status: StatusCodes = StatusCodes.OK,
        charset: string = UTF8_CHARSET,
    ) {
        super(body, cache, status);
        this.mediaType = withCharset(MediaType.HTML, charset);
    }
}

/**
 * Plain text response. Automatically sets Content-Type to text/plain.
 */
export class TextResponse extends SuccessResponse {
    constructor(
        body: string,
        cache?: CacheControl,
        status: StatusCodes = StatusCodes.OK,
        charset: string = UTF8_CHARSET,
    ) {
        super(body, cache, status);
        this.mediaType = withCharset(MediaType.PLAIN_TEXT, charset);
    }
}

/**
 * A response class for streaming binary data.
 *
 * Automatically sets headers for:
 * - Accept-Ranges: bytes
 * - Content-Length
 * - Content-Range (for partial content)
 *
 * The status code is handled internally:
 * - 200 OK for full content
 * - 206 Partial Content for range responses
 *
 * @param stream - The ReadableStream containing the data to send.
 * @param init - Options for the response:
 *   - size: Total size of the data (required)
 *   - offset: Start of the byte range (defaults to 0)
 *   - length: Length of the byte range (defaults to size)
 * @param cache: Optional caching information
 */
export class OctetStream extends WorkerResponse {
    constructor(stream: ReadableStream, init: OctetStreamInit, cache?: CacheControl) {
        const { size, offset = 0, length = size } = init;

        super(stream, cache);
        this.mediaType = MediaType.OCTET_STREAM;

        this.setHeader(HttpHeader.ACCEPT_RANGES, "bytes");
        this.setHeader(HttpHeader.CONTENT_LENGTH, `${length}`);

        if (offset > 0 || length < size) {
            this.setHeader(
                HttpHeader.CONTENT_RANGE,
                `bytes ${offset}-${offset + length - 1}/${size}`,
            );
            this.status = StatusCodes.PARTIAL_CONTENT;
        }
    }
}

/**
 * A streaming response for Cloudflare R2 objects.
 *
 * @param source - The R2 object to stream.
 * @param cache - Optional caching information.
 */
export class R2ObjectStream extends OctetStream {
    constructor(source: R2ObjectBody, cache?: CacheControl) {
        let useCache = cache;
        if (!useCache && source.httpMetadata?.cacheControl) {
            useCache = CacheControl.parse(source.httpMetadata.cacheControl);
        }

        super(source.body, R2ObjectStream.computeRange(source.size, source.range), useCache);

        this.setHeader(HttpHeader.ETAG, source.httpEtag);

        if (source.httpMetadata?.contentType) {
            this.mediaType = source.httpMetadata.contentType;
        }
    }

    /**
     * Computes the byte range for an R2 object, returning all values needed
     * to construct a proper streaming response.
     *
     * Handles three cases:
     * 1. **No range specified** — returns the full object.
     * 2. **Suffix range** (e.g., last N bytes) — calculates offset and length
     *    so that only the requested suffix is returned.
     * 3. **Standard offset/length range** — returns the requested range,
     *    applying defaults if offset or length are missing.
     *
     * @param size - Total size of the R2 object in bytes.
     * @param range - Optional range request.
     * @returns An object containing:
     *   - `size` — total size of the object in bytes
     *   - `offset` — starting byte of the range
     *   - `length` — number of bytes in the range
     */
    private static computeRange(size: number, range?: R2Range): OctetStreamInit {
        if (!range) return { size, offset: 0, length: size };

        if ("suffix" in range) {
            const offset = Math.max(0, size - range.suffix);
            const length = size - offset;
            return { size, offset, length };
        }

        const { offset = 0, length = size } = range;
        return { size, offset, length };
    }
}

/**
 * Response for WebSocket upgrade requests.
 * Automatically sets status to 101 and attaches the client socket.
 */
export class WebSocketUpgrade extends WorkerResponse {
    constructor(client: WebSocket) {
        super(null);
        this.status = StatusCodes.SWITCHING_PROTOCOLS;
        this.webSocket = client;
    }
}

/**
 * Response for `HEAD` requests. Copy headers and status from a `GET` response
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
 * Response for `OPTIONS` preflight requests.
 */
export class Options extends WorkerResponse {
    constructor() {
        super();
        this.status = StatusCodes.NO_CONTENT;
    }
}
