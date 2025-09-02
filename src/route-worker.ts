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
import { BasicWorker } from "./basic-worker";
import { Method } from "./common";
import { NotFound } from "./errors";
import { Routes, RouteCallback, RouteTable } from "./routes";

/**
 * Abstract worker that provides routing capabilities.
 * Extends `BasicWorker` and uses a `Routes` table to map HTTP methods and paths
 * to handler callbacks.
 */
export abstract class RouteWorker extends BasicWorker {
    /** Routing table used for registering and matching routes. */
    protected readonly routes: Routes = new Routes();

    /**
     * Subclasses must implement this method to register their routes
     * using `add()` or `load()`.
     */
    protected abstract registerRoutes(): void;

    /**
     * Loads routes from a `RouteTable` into this worker's route table.
     * @param table The table of routes to load.
     */
    protected load(table: RouteTable): void {
        this.routes.load(table);
    }

    /**
     * Adds a single route to this worker.
     * @param method HTTP method (GET, POST, etc.)
     * @param path Route path
     * @param callback Function to handle requests matching this route
     * @returns The worker instance (for chaining)
     */
    protected add(method: Method, path: string, callback: RouteCallback): this {
        this.routes.add(method, path, callback);
        return this;
    }

    /**
     * Matches the incoming request against registered routes and executes
     * the corresponding callback. Falls back to `BasicWorker.dispatch()` if no match.
     * @returns The response from the matched route or the default handler.
     */
    protected async dispatch(): Promise<Response> {
        this.registerRoutes();

        const found = this.routes.match(this.request.method as Method, this.request.url);
        if (!found) return super.dispatch();

        return found.route.callback.call(this, found.params);
    }

    protected override async get(): Promise<Response> {
        return this.getResponse(NotFound);
    }

    protected override async put(): Promise<Response> {
        return this.getResponse(NotFound);
    }

    protected override async post(): Promise<Response> {
        return this.getResponse(NotFound);
    }

    protected override async patch(): Promise<Response> {
        return this.getResponse(NotFound);
    }

    protected override async delete(): Promise<Response> {
        return this.getResponse(NotFound);
    }
}
