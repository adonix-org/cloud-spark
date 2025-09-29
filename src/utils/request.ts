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

import { lexCompare } from "./compare";

/**
 * Returns a new URL with its query parameters sorted into a stable order.
 *
 * This is useful for cache key generation: URLs that differ only in the
 * order of their query parameters will normalize to the same key.
 *
 * @param request - The incoming Request whose URL will be normalized.
 * @returns A new URL with query parameters sorted by name.
 */
export function sortSearchParams(request: Request): URL {
    const url = new URL(request.url);
    const sorted = new URLSearchParams(
        [...url.searchParams.entries()].sort(([a], [b]) => lexCompare(a, b)),
    );
    url.search = sorted.toString();
    url.hash = "";
    return url;
}

/**
 * Returns a new URL with all query parameters removed.
 *
 * This is useful when query parameters are not relevant to cache lookups,
 * ensuring that variants of the same resource share a single cache entry.
 *
 * @param request - The incoming Request whose URL will be normalized.
 * @returns A new URL with no query parameters.
 */
export function stripSearchParams(request: Request): URL {
    const url = new URL(request.url);
    url.search = "";
    url.hash = "";
    return url;
}

