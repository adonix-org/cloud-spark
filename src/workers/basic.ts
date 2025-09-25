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

import { MethodNotAllowed, InternalServerError, MethodNotImplemented } from "../errors";
import { MiddlewareWorker } from "./middleware";
import { Head, Options } from "../responses";
import { Method, GET, HEAD, OPTIONS } from "../constants/http";

/**
 * Basic worker class providing HTTP method dispatching and error handling.
 */
export abstract class BasicWorker extends MiddlewareWorker {
    /**
     * Entry point to handle a fetch request.
     */
    public override async fetch(): Promise<Response> {
        if (!this.isAllowed(this.request.method)) {
            return this.response(MethodNotAllowed, this);
        }

        try {
            await this.init();
            return await super.fetch();
        } catch (error) {
            console.error(error);
            return this.response(InternalServerError);
        }
    }

    /**
     * Dispatches the request to the method-specific handler.
     */
    protected override async dispatch(): Promise<Response> {
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

        return (handler[method] ?? (() => this.response(MethodNotAllowed, this)))();
    }

    /** Override and implement this method for GET requests. */
    protected async get(): Promise<Response> {
        return this.response(MethodNotImplemented, this);
    }

    /** Override and implement this method for PUT requests. */
    protected async put(): Promise<Response> {
        return this.response(MethodNotImplemented, this);
    }

    /** Override and implement this method for POST requests. */
    protected async post(): Promise<Response> {
        return this.response(MethodNotImplemented, this);
    }

    /** Override and implement this method for PATCH requests. */
    protected async patch(): Promise<Response> {
        return this.response(MethodNotImplemented, this);
    }

    /** Override and implement this method for DELETE requests. */
    protected async delete(): Promise<Response> {
        return this.response(MethodNotImplemented, this);
    }

    /** Returns a default empty OPTIONS response. */
    protected async options(): Promise<Response> {
        return this.response(Options);
    }

    /**
     * Default handler for HEAD requests.
     * Performs a GET request and removes the body for HEAD semantics.
     *
     * Usually does not need to be overridden as this behavior covers
     * standard HEAD requirements.
     */
    protected async head(): Promise<Response> {
        const worker = this.create(
            new Request(this.request.url, { method: GET, headers: this.request.headers }),
        );
        return this.response(Head, await worker.fetch());
    }

    /**
     * DEFAULT allowed HTTP methods for subclasses.
     *
     * These defaults were selected for getting started quickly and should be
     * overridden for each specific worker.
     */
    public getAllowedMethods(): Method[] {
        return [GET, HEAD, OPTIONS];
    }
}
