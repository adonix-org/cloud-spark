# Cloud⚡️Spark

[![npm version](https://img.shields.io/npm/v/@adonix.org/cloud-spark.svg?color=blue)](https://www.npmjs.com/package/@adonix.org/cloud-spark)
[![Apache 2.0 License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://github.com/adonix-org/cloud-spark/blob/main/LICENSE)
[![Build](https://github.com/adonix-org/cloud-spark/actions/workflows/build.yml/badge.svg)](https://github.com/adonix-org/postrise/actions/workflows/build.yml)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=adonix-org_cloud-spark&metric=alert_status)](https://sonarcloud.io/summary/overall?id=adonix-org_cloud-spark&branch=main)
[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=adonix-org_cloud-spark&metric=security_rating)](https://sonarcloud.io/summary/overall?id=adonix-org_cloud-spark&branch=main)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=adonix-org_cloud-spark&metric=coverage)](https://sonarcloud.io/summary/overall?id=adonix-org_cloud-spark&branch=main)

**_Ignite_** your Cloudflare Workers with a type-safe library for rapid development.

Get instant access to common essentials:

- Method & Route dispatch
- CORS
- Caching
- WebSockets

And then explore:

- Custom Middleware
- Nested Workers
- Advanced Routing

:bulb: If you are new to _Cloudflare Workers_, create a free [Cloudflare account](https://dash.cloudflare.com/sign-up) and install their command line interface [Wrangler](#cowboy_hat_face-wrangler). Detailed worker documentation can also be found [here](https://developers.cloudflare.com/workers/).

<br>

## :package: Install

```bash
npm install @adonix.org/cloud-spark
```

<br>

## :rocket: Quickstart

:page_facing_up: hello-world.ts

```ts
import { BasicWorker, TextResponse } from "@adonix.org/cloud-spark";

export class HelloWorld extends BasicWorker {
    get() {
        return this.response(TextResponse, "Hi from Cloud Spark!");
    }
}
```

:page_facing_up: index.ts

```ts
import { HelloWorld } from "./hello-world";

export default HelloWorld.ignite();
```

:computer: Now run your worker locally

```bash
wrangler dev
```

And it's ready on http://localhost:8787

<br>

## :arrow_right: Basic Worker

As shown in the [Quickstart](#rocket-quickstart), BasicWorker is the base class for building Cloudflare Workers with this library. It handles common tasks, including:

- Dispatching incoming HTTP requests to the corresponding handler (GET, POST, PUT, etc.).
- Catching unhandled errors and returning a structured 500 InternalServerError.
- Providing defaults for standard HTTP behavior, such as HEAD requests and OPTIONS responses.
- Ensuring type safety and consistent response formatting.

Subclasses only need to implement the HTTP methods that their Worker will handle. Each method can be overridden independently, and additional functionality such as middleware can be added as needed.

Building on the [Quickstart](#rocket-quickstart), here is a more detailed example:

:page_facing_up: index.ts

```ts
import { BasicWorker, JsonResponse, Method, POST, TextResponse } from "@adonix.org/cloud-spark";

/**
 * To access to the Cloudflare runtime properties:
 *   • this.request — the incoming Request
 *   • this.env — environment bindings (KV, R2, etc.)
 *   • this.ctx — the execution context for background tasks
 */
export class MyWorker extends BasicWorker {
    /**
     * Override to allow additional method support for the worker.
     * Default: GET, HEAD, OPTIONS
     *
     * For OPTIONS requests, the default response is:
     *     204 No Content
     *     "Allow" response header contains the allowed methods
     *
     * If a requested method is not listed, the response is:
     *     405 Method Not Allowed
     *
     * If an allowed method isn’t implemented, the response is:
     *     GET or HEAD: 404 Not Found
     *     All other methods: 501 Not Implemented
     *
     * This example adds POST method support to the defaults.
     */
    public override getAllowedMethods(): Method[] {
        return [...super.getAllowedMethods(), POST];
    }

    /**
     * Example handler for GET requests that returns a simple
     * text response.
     */
    protected override get(): Promise<Response> {
        return this.response(TextResponse, "Hello from Cloud Spark!");
    }

    /**
     * Example handler for POST requests that echoes the
     * incoming JSON.
     */
    protected override async post(): Promise<Response> {
        const json = await this.request.json();
        // Do something with the request JSON.

        return this.response(JsonResponse, json);
    }

    /**
     * Supported BasicWorker request methods:
     *    protected override get(): Promise<Response>
     *    protected override put(): Promise<Response>
     *    protected override post(): Promise<Response>
     *    protected override patch(): Promise<Response>
     *    protected override delete(): Promise<Response>
     *
     * Implementations are provided but can be overridden for:
     *    protected override head(): Promise<Response>
     *    protected override options(): Promise<Response>
     */
}

/**
 * Connects this worker to the Cloudflare runtime.
 */
export default MyWorker.ignite();
```

<br>

## :twisted_rightwards_arrows: Route Worker

RouteWorker extends [BasicWorker](#arrow_right-basic-worker) to provide route-based request handling making it easy to define multiple endpoints in a single Worker. It provides:

- Registering routes individually or in bulk.
- Matching incoming requests to registered routes by HTTP method and path.
- Support for URL path patterns using [path-to-regex](https://github.com/pillarjs/path-to-regexp) syntax.
- Dispatching requests to either a callback function or another Worker.

Example:

:page_facing_up: index.ts

```ts
```
<br>

## :left_right_arrow: Web Sockets

<br>

## :gear: Middleware

<br>

## :cowboy_hat_face: Wrangler

First, create a **FREE** [Cloudflare account](https://dash.cloudflare.com/sign-up).

:computer: Install Wrangler

```bash
npm install -g wrangler
```

:computer: Login

```bash
wrangler login
```

:computer: Initialize a new Cloudflare Worker project

```bash
wrangler init
```

[Install](#package-install) Cloud Spark
