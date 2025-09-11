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
 * Normalizes a URL string for use as a consistent cache key.
 *
 * - Sorts query parameters alphabetically so `?b=2&a=1` and `?a=1&b=2` are treated the same.
 * - Strips fragment identifiers (`#...`) since they are not sent in HTTP requests.
 * - Leaves protocol, host, path, and query values intact.
 *
 * @param url The original URL string to normalize.
 * @returns A normalized URL string suitable for hashing or direct cache key use.
 */
export function normalizeUrl(url: string): URL {
    const u = new URL(url);

    const params = [...u.searchParams.entries()];
    params.sort(([a], [b]) => lexCompare(a, b));

    u.search = params
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join("&");
    u.hash = "";

    return u;
}
