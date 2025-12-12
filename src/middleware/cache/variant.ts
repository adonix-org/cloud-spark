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

import { HttpHeader } from "../../constants/headers";
import { CacheControl, WorkerResponse } from "../../core";
import { getHeaderValues } from "../../utils/headers";

import { getCacheControl, getFilteredVary } from "./utils";

/**
 * Represents a Vary-aware cached response.
 *
 * Extends WorkerResponse to track which request headers affect the cached
 * response (Vary headers) and ensure correct TTL handling.
 *
 * This class is used internally in the caching system to:
 * - Store responses with full awareness of Vary headers.
 * - Append new Vary headers safely.
 * - Update TTLs to match incoming origin responses.
 * - Track whether the cached variant has been modified.
 */
export class VariantResponse extends WorkerResponse {
    private _isModified = false;

    private constructor(vary: string[]) {
        const filtered = getFilteredVary(vary);
        if (filtered.length === 0) {
            throw new Error("The filtered vary array is empty.");
        }

        super();
        this.setHeader(HttpHeader.INTERNAL_VARIANT_SET, filtered);
    }

    /**
     * Creates a new VariantResponse with the specified Vary headers.
     *
     * @param vary - Array of request headers this response varies on.
     * @returns A new VariantResponse instance.
     */
    public static new(vary: string[]): VariantResponse {
        return new VariantResponse(getFilteredVary(vary));
    }

    /**
     * Restores a VariantResponse from an existing Response.
     *
     * @param source - The cached Response to restore.
     * @throws If the source response is not a variant response.
     * @returns A VariantResponse instance containing the original Vary headers and cache control.
     */
    public static restore(source: Response): VariantResponse {
        if (!VariantResponse.isVariantResponse(source)) {
            throw new Error("The source response is not a variant response");
        }

        const variant = VariantResponse.new(
            getHeaderValues(source.headers, HttpHeader.INTERNAL_VARIANT_SET),
        );

        const cacheControl = source.headers.get(HttpHeader.CACHE_CONTROL);
        if (cacheControl) variant.cache = CacheControl.parse(cacheControl);

        return variant;
    }

    /**
     * Returns the Vary headers tracked by this response.
     */
    public get vary(): string[] {
        return getHeaderValues(this.headers, HttpHeader.INTERNAL_VARIANT_SET);
    }

    /**
     * Indicates whether the variant has been modified since creation or restoration.
     */
    public get isModified(): boolean {
        return this._isModified;
    }

    /**
     * Appends additional Vary headers to this response.
     *
     * Updates the internal _isModified flag if new headers are added.
     *
     * @param vary - Array of headers to merge into the existing Vary set.
     */
    public append(vary: string[]): void {
        const before = this.vary.length;
        this.mergeHeader(HttpHeader.INTERNAL_VARIANT_SET, getFilteredVary(vary));
        this._isModified = this.vary.length !== before;
    }

    /**
     * Determines if a response is a VariantResponse.
     *
     * @param response - The Response object to inspect.
     * @returns `true` if the response is a variant; otherwise `false`.
     */
    public static isVariantResponse(response: Response): boolean {
        return response.headers.has(HttpHeader.INTERNAL_VARIANT_SET);
    }

    /**
     * Updates this variant’s TTL to ensure it does not expire before
     * the TTL of the given origin response.
     *
     * Only modifies the TTL if the origin response explicitly provides
     * s-maxage or max-age. Updates _isModified if the TTL increases.
     *
     * @param response - The origin Response whose TTL should be considered.
     */
    public expireAfter(response: Response): void {
        const incoming = getCacheControl(response.headers);

        const incomingTTL = incoming["s-maxage"] ?? incoming["max-age"];
        if (incomingTTL === undefined) return;

        const currentTTL = this.cache?.["s-maxage"];

        if (currentTTL === undefined || incomingTTL > currentTTL) {
            this.cache = {
                "s-maxage": incomingTTL,
            };
            this._isModified = true;
        }
    }
}
