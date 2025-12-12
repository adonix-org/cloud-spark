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

import { MethodNotAllowed, Middleware } from "../core";
import { assertMiddleware } from "../guards/middleware";

import { BaseWorker } from "./base";

/** Base worker for handling middleware chains. */
export abstract class MiddlewareWorker extends BaseWorker {
    /** Middleware handlers registered for this worker. */
    protected readonly middlewares: Middleware[] = [];

    /**
     * Hook for subclasses to perform any initialization.
     */
    protected init(): void | Promise<void> {
        return;
    }

    /**
     * Add one or more middleware instances to this worker.
     *
     * The middleware will run for every request handled by this worker,
     * in the order they are added.
     *
     * @param middleware - One or more middleware instances to run.
     * @returns `this` to allow chaining multiple `.use()` calls.
     */
    public use(...middleware: Middleware[]): this {
        for (const value of middleware) {
            assertMiddleware(value);
        }

        this.middlewares.push(...middleware);
        return this;
    }

    /**
     * Executes the middleware chain and dispatches the request if the method
     * is allowed by the worker.
     *
     * @returns The Response produced by the last middleware or `dispatch()`.
     */
    public override async fetch(): Promise<Response> {
        /**
         * Allow subclasses to add middleware to be used for the request.
         */
        await this.init();

        const chain = this.middlewares.reduceRight(
            (next, handler) => () => handler.handle(this, next),
            () => {
                if (!this.isAllowed(this.request.method)) {
                    return this.response(MethodNotAllowed, this);
                }
                return this.dispatch();
            },
        );
        return chain();
    }
}
