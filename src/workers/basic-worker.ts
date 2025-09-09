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

import { GET, isMethod, Method } from "../common";
import { MethodNotAllowed, InternalServerError, MethodNotImplemented } from "../errors";
import { MiddlewareWorker } from "./middleware-worker";
import { Head, WorkerResponse } from "../responses";
import { Worker } from "../interfaces/worker";

/**
 * Basic worker class providing HTTP method dispatching and error handling.
 */
export abstract class BasicWorker extends MiddlewareWorker {
    /**
     * Entry point to handle a fetch request.
     */
    public override async fetch(): Promise<Response> {
        try {
            await this.init();
            return await super.fetch();
        } catch (error) {
            console.error(error);
            return this.getResponse(InternalServerError);
        }
    }

    /**
     * Dispatches the request to the method-specific handler.
     */
    protected override async dispatch(): Promise<Response> {
        const method = this.request.method as Method;
        if (!this.isAllowed(method)) {
            return this.getResponse(MethodNotAllowed);
        }
        const handler: Record<Method, () => Promise<Response>> = {
            GET: () => this.get(),
            PUT: () => this.put(),
            HEAD: () => this.head(),
            POST: () => this.post(),
            PATCH: () => this.patch(),
            DELETE: () => this.delete(),
        };
        return (handler[method] ?? (() => this.getResponse(MethodNotAllowed)))();
    }

    /**
     * Hook for subclasses to perform any initialization.
     */
    protected init(): void | Promise<void> {
        return;
    }

    /**
     * Checks if the given HTTP method is allowed for this worker.
     * @param method HTTP method string
     * @returns true if the method is allowed
     */
    public isAllowed(method: Method): boolean {
        return isMethod(method) && this.getAllowedMethods().includes(method);
    }

    /** Override and implement this method for GET requests. */
    protected async get(): Promise<Response> {
        return this.getResponse(MethodNotImplemented);
    }

    /** Override and implement this method for PUT requests. */
    protected async put(): Promise<Response> {
        return this.getResponse(MethodNotImplemented);
    }

    /** Override and implement this method for POST requests. */
    protected async post(): Promise<Response> {
        return this.getResponse(MethodNotImplemented);
    }

    /** Override and implement this method for PATCH requests. */
    protected async patch(): Promise<Response> {
        return this.getResponse(MethodNotImplemented);
    }

    /** Override and implement this method for DELETE requests. */
    protected async delete(): Promise<Response> {
        return this.getResponse(MethodNotImplemented);
    }

    /**
     * Default handler for HEAD requests.
     * Performs a GET request and removes the body for HEAD semantics.
     *
     * Usually does not need to be overridden, as this behavior covers
     * standard HEAD requirements.
     */
    protected async head(): Promise<Response> {
        const worker = this.create(new Request(this.request, { method: GET }));
        return this.getResponse(Head, await worker.fetch());
    }

    /**
     * Simplify and standardize {@link Response} creation by extending {@link WorkerResponse}
     * or any of its subclasses and passing to this method.
     *
     * Or directly use any of the built-in classes.
     *
     * ```ts
     * this.getResponse(TextResponse, "Hello World!")
     * ```
     *
     * @param ResponseClass The response class to instantiate
     * @param args Additional constructor arguments
     * @returns A Promise resolving to the {@link Response} object
     */
    protected async getResponse<
        T extends WorkerResponse,
        Ctor extends new (worker: Worker, ...args: any[]) => T,
    >(
        ResponseClass: Ctor,
        ...args: ConstructorParameters<Ctor> extends [Worker, ...infer R] ? R : never
    ): Promise<Response> {
        return new ResponseClass(this, ...args).getResponse();
    }
}
