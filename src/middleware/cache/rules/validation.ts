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

import { StatusCodes, Worker } from "../../../core";

import { CacheRule, CacheValidators } from "./interfaces";
import { getCacheValidators } from "./utils";

/**
 * Base class for cache validation rules.
 *
 * `ValidationRule` provides a standard mechanism for inspecting an outgoing response,
 * extracting a specific header (such as `ETag` or `Last-Modified`),
 * and applying cache validators from the incoming request.
 *
 * Subclasses implement:
 * - `getHeader()` to extract the relevant header from the response.
 * - `response()` to decide whether to return the response as-is,
 *   replace it with a conditional response (e.g., `304 Not Modified`),
 *   or return `undefined` to indicate the cached response is invalid.
 *
 * Rules derived from this class are typically used to implement
 * conditional GET handling and other validation-aware caching logic.
 *
 * @template H - The type of header value extracted from the response (e.g., `string` or `Date`).
 */
export abstract class ValidationRule<H> implements CacheRule {
    /**
     * Extracts the target header value from a response.
     *
     * Implementations should return `undefined` if the header is missing or invalid.
     *
     * @param response - The response to inspect.
     * @returns The parsed header value, or `undefined` if unavailable.
     */
    protected abstract getHeader(response: Response): H | undefined;

    /**
     * Applies cache validation logic using the extracted header and request validators.
     *
     * Implementations determine whether the response is still valid or requires revalidation.
     * Returning `undefined` signals that the cached response cannot be used.
     *
     * @param response - The original response from the cache or origin.
     * @param header - The extracted header value relevant to validation.
     * @param validators - Parsed conditional headers from the incoming request.
     * @returns A `Response` if valid, or `undefined` if the cache entry is invalid.
     */
    protected abstract response(
        response: Response,
        header: H,
        validators: CacheValidators,
    ): Promise<Response | undefined>;

    /**
     * Core entry point for cache validation rules.
     *
     * Executes the next handler in the chain, inspects the resulting response,
     * and applies subclass-specific validation logic if appropriate.
     *
     * @param worker - The worker context for the current request.
     * @param next - A function that invokes the next rule or final handler.
     * @returns A validated `Response`, or `undefined` if validation fails.
     */
    public async apply(
        worker: Worker,
        next: () => Promise<Response | undefined>,
    ): Promise<Response | undefined> {
        const response = await next();
        if (!response || response.status !== StatusCodes.OK) return response;

        const header = this.getHeader(response);
        if (header === undefined) return response;

        const validators = getCacheValidators(worker.request.headers);
        return this.response(response, header, validators);
    }
}
