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

import { GET, Method, OPTIONS } from "../constants/methods";
import { InternalServerError, MethodNotAllowed, MethodNotImplemented, NotFound } from "../errors";
import { Head, Options } from "../responses";

import { MiddlewareWorker } from "./middleware";

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
            return this.response(InternalServerError);
        }
    }

    /**
     * Dispatches the request to the method-specific handler.
     */
    protected override dispatch(): Promise<Response> {
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

    /** Override and implement this method for `GET` requests. */
    protected get(): Promise<Response> {
        return this.response(NotFound);
    }

    /** Override and implement this method for `PUT` requests. */
    protected put(): Promise<Response> {
        return this.response(MethodNotImplemented, this);
    }

    /** Override and implement this method for `POST` requests. */
    protected post(): Promise<Response> {
        return this.response(MethodNotImplemented, this);
    }

    /** Override and implement this method for `PATCH` requests. */
    protected patch(): Promise<Response> {
        return this.response(MethodNotImplemented, this);
    }

    /** Override and implement this method for `DELETE` requests. */
    protected delete(): Promise<Response> {
        return this.response(MethodNotImplemented, this);
    }

    /** Returns the default `OPTIONS` response. */
    protected options(): Promise<Response> {
        return this.response(Options, this);
    }

    /**
     * Default handler for `HEAD` requests.
     * Performs a `GET` request and removes the body for `HEAD` semantics.
     *
     * Usually does not need to be overridden as this behavior covers
     * standard `HEAD` requirements.
     */
    protected async head(): Promise<Response> {
        const worker = this.create(
            new Request(this.request.url, { method: GET, headers: this.request.headers }),
        );
        return this.response(Head, await worker.fetch());
    }

    /**
     * Returns the HTTP methods allowed by this worker.
     *
     * - GET and HEAD are always allowed per RFC 7231, even if not listed here.
     * - OPTIONS is included by default since a default handler is implemented.
     * - Subclasses can override this method to allow additional methods or change the defaults.
     */
    public getAllowedMethods(): Method[] {
        return [OPTIONS];
    }
}
