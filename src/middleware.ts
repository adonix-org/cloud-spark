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

import { Worker } from "./worker";

/**
 * Abstract base class for Worker middleware.
 * Provides a structured pre/post pattern around the next middleware or final handler,
 * with optional short-circuit support.
 */
export abstract class Middleware {
    /**
     * Implement this method to perform logic **before** the next middleware.
     * Can inspect or modify the request via the worker instance.
     * Return a Response to short-circuit the chain, or `undefined` to continue.
     * @param worker The worker handling the request
     */
    protected pre(_worker: Worker): void | Response | Promise<void | Response> {
        return;
    }

    /**
     * Implement this method to perform logic **after** the next middleware.
     * Can inspect or modify the response before it is returned.
     * @param worker The worker handling the request
     * @param response The Response returned from the next middleware or final handler
     */
    protected post(_worker: Worker, _response: Response): Response | Promise<Response> {
        return _response;
    }

    /**
     * Executes this middleware around the next middleware or final handler.
     * Calls `pre`, then `next()` if not short-circuited, then `post`.
     */
    public async handle(worker: Worker, next: () => Promise<Response>): Promise<Response> {
        const preResponse = await this.pre(worker);
        if (preResponse instanceof Response) return preResponse;

        const response = await next();

        const postResponse = await this.post(worker, response);
        return postResponse;
    }
}
