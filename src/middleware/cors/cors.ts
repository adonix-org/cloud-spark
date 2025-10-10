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

import { assertCorsInit } from "../../guards/cors";
import { CorsInit } from "../../interfaces/cors";
import { Middleware } from "../../interfaces/middleware";
import { CorsHandler } from "./handler";

/**
 * Creates a `CORS` middleware instance.
 *
 * This middleware automatically handles Cross-Origin Resource Sharing (CORS)
 * for incoming requests, including preflight `OPTIONS` requests, and adds
 * appropriate headers to responses.
 *
 * @param init - Optional configuration for `CORS` behavior. See {@link CorsConfig}.
 * @returns A {@link Middleware} instance that can be used in your middleware chain.
 */
export function cors(init?: CorsInit): Middleware {
    assertCorsInit(init);
    return new CorsHandler(init);
}
