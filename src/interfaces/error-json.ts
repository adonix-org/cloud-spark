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
 * Structure for JSON-formatted error responses.
 *
 * This interface defines the standard shape of error responses returned
 * by middleware or workers when an operation fails. It ensures consistent
 * error reporting and easy parsing by clients.
 */
export interface ErrorJson {
    /**
     * HTTP status code associated with the error.
     *
     * Example: `404` for Not Found, `500` for Internal Server Error.
     */
    status: number;

    /**
     * Standard HTTP reason phrase corresponding to the status code.
     *
     * Example: `"Not Found"` for 404, `"Internal Server Error"` for 500.
     */
    error: string;

    /**
     * Optional detailed message describing the error.
     *
     * This can include additional context, debugging hints, or
     * information useful to the client. Will be an empty string
     * if no details are provided.
     */
    details: string;
}
