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
 * Minimal interface representing a Worker.
 *
 * Any class implementing this interface must provide a `fetch` method
 * that handles a request and returns a Response (or a Promise resolving to a Response).
 */
export interface Worker {
    /**
     * Processes a request and returns a Response.
     *
     * @returns A Promise resolving to the Response
     */
    fetch(): Promise<Response>;
}
