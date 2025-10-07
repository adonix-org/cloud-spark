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

import { CacheControl } from "../../constants/cache";
import { HttpHeader } from "../../constants/headers";
import { MediaType, UTF8_CHARSET } from "../../constants/media";
import { Time } from "../../constants/time";
import { assertVariantSet } from "../../guards/cache";
import { WorkerResponse } from "../../responses";
import { stringArraysEqual } from "../../utils/compare";
import { withCharset } from "../../utils/media";
import { getCacheControl } from "./utils";

export type VariantSet = string[][];

const DEFAULT_TTL = 5 * Time.Minute;
const BUFFER_SECONDS = 30;

const DEFAULT_CACHE: CacheControl = {
    public: true,
    "s-maxage": DEFAULT_TTL,
} as const;

export class VariantResponse extends WorkerResponse {
    public override cache: CacheControl = { ...DEFAULT_CACHE };
    private variants: VariantSet = [];

    private constructor() {
        super();
        this.mediaType = withCharset(MediaType.JSON, UTF8_CHARSET);
        this.setHeader(HttpHeader.INTERNAL_VARIANT_SET, "true");
    }

    public static new(): VariantResponse {
        return new VariantResponse();
    }

    public static async restore(source: Response): Promise<VariantResponse> {
        if (!VariantResponse.isVariantResponse(source)) {
            throw new Error("The source response is not a Variant Response");
        }

        const response = VariantResponse.new();
        response.cache = { ...DEFAULT_CACHE, ...getCacheControl(source.headers) };

        const json = await source.clone().json();
        assertVariantSet(json);
        response.variants = json;

        return response;
    }

    public override async response(): Promise<Response> {
        this.addCacheHeader();
        this.addContentType();
        return new Response(JSON.stringify(this.variants), this.responseInit);
    }

    public refreshCache(response: Response): void {
        const incoming = getCacheControl(response.headers);
        const incomingTTL = (incoming["s-maxage"] ?? DEFAULT_TTL) + BUFFER_SECONDS;
        const currentTTL = this.cache["s-maxage"] ?? DEFAULT_TTL;

        if (incomingTTL > currentTTL) {
            this.cache["s-maxage"] = incomingTTL;
        }
    }

    public append(vary: string[]): void {
        if (!this.match(vary)) this.variants.push(vary);
    }

    public match(vary: string[]): string[] | undefined {
        for (const variant of this.variants) {
            if (stringArraysEqual(variant, vary)) {
                return variant;
            }
        }
        return undefined;
    }

    public intersect_maybe(requestHeaders: string[]): string[] | undefined {
        let bestMatch: string[] | undefined = undefined;
        let maxMatches = 0;

        for (const variant of this.variants) {
            const matches = variant.filter((h) => requestHeaders.includes(h)).length;

            if (matches > maxMatches) {
                maxMatches = matches;
                bestMatch = variant;
            }
        }

        return maxMatches > 0 ? bestMatch : undefined;
    }
    public intersect(requestHeaders: string[]): string[] | undefined {
        let bestMatch: string[] | undefined;
        let maxMatches = 0; // start at 0, not -1

        for (const variant of this.variants) {
            const matches = variant.filter((h) => requestHeaders.includes(h)).length;

            if (matches > maxMatches) {
                maxMatches = matches;
                bestMatch = variant;
            } else if (matches === maxMatches && variant.length === 0) {
                bestMatch = variant;
            }
        }

        // Only return if there was at least one matching header
        return maxMatches > 0 ? bestMatch : undefined;
    }

    public static isVariantResponse(response: Response): boolean {
        return response.headers.has(HttpHeader.INTERNAL_VARIANT_SET);
    }
}
