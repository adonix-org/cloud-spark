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

import { HttpHeader } from "../../constants/http";
import { getHeaderValues, lexCompare, normalizeUrl } from "../../utils";
import { VARY_WILDCARD } from "./constants";

const BASE_CACHE_URL = "http://cache";

export function isCacheable(response: Response): boolean {
    if (!response.ok) return false;
    if (getVaryHeader(response).includes(VARY_WILDCARD)) return false;

    return true;
}

export function getVaryHeader(response: Response): string[] {
    const values = getHeaderValues(response.headers, HttpHeader.VARY);
    return Array.from(new Set(values.map((v) => v.toLowerCase()))).sort(lexCompare);
}

export function getVaryFiltered(vary: string[]): string[] {
    return vary
        .map((h) => h.toLowerCase())
        .filter((value) => value !== HttpHeader.ACCEPT_ENCODING.toLowerCase());
}

export function getVaryKey(request: Request, vary: string[]): string {
    const url = normalizeUrl(request.url);
    const baseUrl = url.origin + url.pathname;

    const varyPairs: [string, string][] = [];
    const filtered = getVaryFiltered(vary);
    filtered.sort(lexCompare);
    filtered.forEach((header) => {
        const value = request.headers.get(header);
        if (value !== null) {
            varyPairs.push([header, value]);
        }
    });

    const encoded = base64UrlEncode(JSON.stringify([baseUrl, varyPairs]));
    const search = url.searchParams.toString();

    const encodedUrl = new URL(`${encoded}?${search}`, BASE_CACHE_URL);
    return encodedUrl.href;
}

export function base64UrlEncode(str: string): string {
    const utf8 = new TextEncoder().encode(str);
    let base64 = btoa(String.fromCharCode(...utf8));
    return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
