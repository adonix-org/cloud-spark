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

import { BaseWorker } from "./base-worker";
import { Worker } from "./worker";

/**
 * Middleware for a Worker.
 *
 * Middleware can inspect or modify the request, perform side effects,
 * and optionally call the next middleware or final handler.
 */
export interface Middleware {
    /**
     * Handle a request in the context of the given worker.
     *
     * @param worker - The Worker instance handling the request. Provides
     *                 access to the request, Cloudflare env, ctx, etc.
     * @param next - Function to call the next middleware or final handler.
     *               Must return a Promise of a Response.
     * @returns A Response, either from this middleware or from the next.
     */
    handle(worker: Worker, next: () => Promise<Response>): Promise<Response>;
}

/**
 * Worker that supports class-based middleware with optional always-run middleware.
 * Extends CacheWorker to include caching logic automatically.
 */
export abstract class MiddlewareWorker extends BaseWorker {
    private readonly middlewares: Middleware[] = [];

    /**
     * Register a middleware instance.
     * @param mw Middleware to register
     */
    public register(mw: Middleware): this {
        this.middlewares.push(mw);
        return this;
    }

    protected abstract dispatch(): Promise<Response>;

    /**
     * Dispatches the current request through the registered middleware chain
     * and ultimately to the final worker handler.
     *
     * Middleware are executed in **last-registered-first-called** order (via reduceRight).
     * Each middleware receives the worker instance and a `next` function to call the
     * next middleware or final handler.
     *
     * @returns A Promise resolving to the Response returned by the middleware chain
     *          or the final handler.
     */
    public async fetch(): Promise<Response> {
        const chain = this.middlewares.reduceRight(
            (next, mw) => () => mw.handle(this, next),
            () => this.dispatch()
        );
        return await chain();
    }
}
