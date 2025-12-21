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

/**
 * Configuration options for the cache middleware.
 */
export interface CacheInit {
    /**
     * Name of the cache storage to use.
     * If omitted, the default cache is used.
     */
    name?: string;

    /**
     * Function that maps the incoming request
     * to a cache key.
     */
    getKey: (request: Request) => URL;

    /**
     * Enables debug information in response headers.
     * Currently adds the cache key header on cache hits.
     * Default: FALSE
     */
    debug?: boolean;
}
