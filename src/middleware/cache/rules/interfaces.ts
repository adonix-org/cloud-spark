/*
 * Copyright (C) 2025 Ty Busby
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 *
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

import { Worker } from "../../../interfaces/worker";

/**
 * Represents a byte range parsed from an HTTP `Range` header.
 *
 * Typically used to request partial content from a resource.
 * - `start` marks the beginning of the range (inclusive).
 * - `end` is optional; if omitted, the range extends to the end of the resource.
 */
export interface ByteRange {
    start: number;
    end?: number;
}

/**
 * A rule that participates in the cache decision pipeline.
 *
 * Each `CacheRule` receives the active worker context and a
 * `next()` callback representing the next stage in the chain.
 * Implementations can:
 * - Short-circuit the chain by returning a cached response.
 * - Call `next()` to continue evaluation.
 * - Modify the response before returning it.
 */
export interface CacheRule {
    /**
     * Applies the rule to a request/response cache pipeline.
     *
     * @param worker - The worker instance handling the current request.
     * @param next - A function that invokes the next rule or final handler.
     * @returns A cached response, or `undefined` if no cached response exists or can be used.
     */
    apply(worker: Worker, next: () => Promise<Response | undefined>): Promise<Response | undefined>;
}

/**
 * Parsed conditional request headers that influence cache validation.
 *
 * These headers determine whether a cached resource can be reused
 * or if a fresh copy should be fetched.
 */
export interface CacheValidators {
    /** Entity tags that must **not** match for a response to be considered valid (`If-None-Match`). */
    ifNoneMatch: string[];

    /** Entity tags that **must** match for a response to be considered valid (`If-Match`). */
    ifMatch: string[];

    /** Timestamp after which the resource is considered modified (`If-Modified-Since`). */
    ifModifiedSince: string | null;

    /** Timestamp before which the resource must remain unmodified (`If-Unmodified-Since`). */
    ifUnmodifiedSince: string | null;
}
