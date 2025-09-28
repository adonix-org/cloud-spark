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

import { Middleware } from "../middleware/middleware";

/**
 * Asserts at runtime that a value is a Middleware instance.
 *
 * @param handler - The value to check.
 * @throws TypeError If `handler` is not a `Middleware` subclass instance.
 */
export function assertMiddleware(handler: unknown): asserts handler is Middleware {
    if (handler instanceof Middleware) return;

    throw new TypeError("Handler must be a subclass of Middleware.");
}
