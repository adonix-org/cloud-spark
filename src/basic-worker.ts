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

import { isMethod, Method } from "./common";
import { MethodNotAllowed, InternalServerError, MethodNotImplemented } from "./errors";
import { MiddlewareWorker } from "./middleware-worker";
import { Head, Options, WorkerResponse } from "./response";
import { Worker } from "./worker";

/**
 * Base worker class providing HTTP method dispatching, caching, and error handling.
 * Extends `CacheWorker` and defines default implementations for HTTP methods.
 */
export abstract class BasicWorker extends MiddlewareWorker {
    /**
     * Entry point to handle a fetch request.
     * Checks allowed methods, serves cached responses, or dispatches to the appropriate handler.
     */
    public async fetch(): Promise<Response> {
        if (!this.isAllowed(this.request.method)) {
            return this.getResponse(MethodNotAllowed);
        }

        try {
            this.init();
            return await super.fetch();
        } catch (error) {
            console.error(error);
            return this.getResponse(InternalServerError);
        }
    }

    /**
     * Dispatches the request to the method-specific handler.
     * Defaults to MethodNotAllowed if the HTTP method is not recognized.
     */
    protected async dispatch(): Promise<Response> {
        const method = this.request.method as Method;
        const handler: Record<Method, () => Promise<Response>> = {
            GET: () => this.get(),
            PUT: () => this.put(),
            HEAD: () => this.head(),
            POST: () => this.post(),
            PATCH: () => this.patch(),
            DELETE: () => this.delete(),
            OPTIONS: () => this.options(),
        };
        return (handler[method] ?? (() => this.getResponse(MethodNotAllowed)))();
    }

    /**
     * Hook for subclasses to perform any initialization.
     */
    protected init(): void {
        return;
    }

    /**
     * Checks if the given HTTP method is allowed for this worker.
     * @param method HTTP method string
     * @returns true if the method is allowed
     */
    public isAllowed(method: string): boolean {
        return isMethod(method) && this.getAllowedMethods().includes(method);
    }

    /** Default handler for GET requests. Returns MethodNotImplemented unless overridden. */
    protected async get(): Promise<Response> {
        return this.getResponse(MethodNotImplemented);
    }

    /** Default handler for PUT requests. Returns MethodNotImplemented unless overridden. */
    protected async put(): Promise<Response> {
        return this.getResponse(MethodNotImplemented);
    }

    /** Default handler for POST requests. Returns MethodNotImplemented unless overridden. */
    protected async post(): Promise<Response> {
        return this.getResponse(MethodNotImplemented);
    }

    /** Default handler for PATCH requests. Returns MethodNotImplemented unless overridden. */
    protected async patch(): Promise<Response> {
        return this.getResponse(MethodNotImplemented);
    }

    /** Default handler for DELETE requests. Returns MethodNotImplemented unless overridden. */
    protected async delete(): Promise<Response> {
        return this.getResponse(MethodNotImplemented);
    }

    /**
     * Default handler for OPTIONS requests.
     * Returns an Options response.
     *
     * Typically does not need to be overridden.
     */
    protected async options(): Promise<Response> {
        return this.getResponse(Options);
    }

    /**
     * Default handler for HEAD requests.
     * Performs a GET request internally and removes the body for HEAD semantics.
     *
     * Usually does not need to be overridden, as this behavior covers standard HEAD requirements.
     */
    protected async head(): Promise<Response> {
        const worker = this.create(new Request(this.request, { method: Method.GET }));
        return this.getResponse(Head, await worker.fetch());
    }

    /**
     * Helper to construct a WorkerResponse of the given class with arguments.
     * @param ResponseClass The response class to instantiate
     * @param args Additional constructor arguments
     * @returns The final Response object
     */
    protected async getResponse<
        T extends WorkerResponse,
        Ctor extends new (worker: Worker, ...args: any[]) => T
    >(
        ResponseClass: Ctor,
        ...args: ConstructorParameters<Ctor> extends [Worker, ...infer R] ? R : never
    ): Promise<Response> {
        return new ResponseClass(this, ...args).getResponse();
    }
}
