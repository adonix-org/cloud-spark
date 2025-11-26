# Cloud:zap:Spark

[![npm version](https://img.shields.io/npm/v/@adonix.org/cloud-spark.svg?color=blue)](https://www.npmjs.com/package/@adonix.org/cloud-spark)
[![Apache 2.0 License](https://badges.adonix.org/License/Apache%202.0?color=blue)](https://github.com/adonix-org/cloud-spark/blob/main/LICENSE)
[![Build](https://github.com/adonix-org/cloud-spark/actions/workflows/build.yml/badge.svg)](https://github.com/adonix-org/postrise/actions/workflows/build.yml)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=adonix-org_cloud-spark&metric=alert_status)](https://sonarcloud.io/summary/overall?id=adonix-org_cloud-spark&branch=main)
[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=adonix-org_cloud-spark&metric=security_rating)](https://sonarcloud.io/summary/overall?id=adonix-org_cloud-spark&branch=main)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=adonix-org_cloud-spark&metric=coverage)](https://sonarcloud.io/summary/overall?id=adonix-org_cloud-spark&branch=main)

**_Ignite_** your Cloudflare Workers with a type-safe library for rapid development.

CloudSpark provides a logical foundation for building Cloudflare Workers. It works well for simple workers or projects that grow in complexity, helping keep code organized and functionality scalable. It is lightweight and designed to let you focus on the logic that powers your worker.

:bulb: If you are new to _Cloudflare Workers_, create a free [Cloudflare account](https://dash.cloudflare.com/sign-up) and install their command line interface [Wrangler](#partly_sunny-wrangler).

Detailed worker documentation can also be found [here](https://developers.cloudflare.com/workers/).

<br>

## :books: Contents

- [Install](#package-install)

- [Quickstart](#rocket-quickstart)

- [Basic Worker](#arrow_right-basic-worker)

- [Route Worker](#twisted_rightwards_arrows-route-worker)

- [Middleware](#gear-middleware)
    - [CORS](#cors)
    - [Cache](#cache)
    - [WebSocket](#websocket)
    - [Custom](#custom)
    - [Ordering](#ordering)

- [WebSockets](#left_right_arrow-web-sockets)

- [Wrangler](#partly_sunny-wrangler)

- [Links](#link-links)

<br>

## :package: Install

```bash
npm install @adonix.org/cloud-spark
```

<br>

## :rocket: Quickstart

:computer: Use [Wrangler](#partly_sunny-wrangler) to create a new project:

```bash
wrangler init

╭ Create an application with Cloudflare Step 1 of 3
│
├ In which directory do you want to create your application?
│ dir ./hello-world
│
├ What would you like to start with?
│ category Hello World example
│
├ Which template would you like to use?
│ type Worker only
│
├ Which language do you want to use?
│ lang TypeScript
│
├ Copying template files
│ files copied to project directory
│
├ Updating name in `package.json`
│ updated `package.json`
│
├ Installing dependencies
│ installed via `npm install`
│
╰ Application created
```

:computer: [Install](#package-install) CloudSpark:

```bash
cd ./hello-world

npm install @adonix.org/cloud-spark

# Open the project in your IDE, for example, VS Code:
code .
```

:page_facing_up: index.ts

```ts
import { BasicWorker, TextResponse } from "@adonix.org/cloud-spark";

class HelloWorld extends BasicWorker {
    get() {
        return this.response(TextResponse, "Hi from Cloud Spark!");
    }
}

export default HelloWorld.ignite();
```

:computer: Now to run the worker locally:

```bash
wrangler dev
```

And it's ready on http://localhost:8787

<br>

## :arrow_right: Basic Worker

As shown in the [Quickstart](#rocket-quickstart), BasicWorker is the base class for building Cloudflare Workers with CloudSpark. It handles common tasks, including:

- Dispatching incoming HTTP requests to the corresponding handler (GET, POST, PUT, etc.).
- Providing defaults for standard HTTP behavior, such as HEAD and OPTIONS requests.
- Ensuring type safety and consistent response formatting.
- Support for built-in and custom middleware.
- Catching unhandled errors.

Subclasses only need to implement the HTTP methods their worker will handle. Each method can be overridden independently, and additional functionality such as [middleware](#gear-middleware) can be added as needed.

Building on the [Quickstart](#rocket-quickstart), what follows is a more complete example:

:page_facing_up: index.ts

```ts
import { BasicWorker, JsonResponse, Method, POST, TextResponse } from "@adonix.org/cloud-spark";

/**
 * To access the Cloudflare runtime properties:
 *   • this.request — the incoming Request
 *   • this.env — environment bindings (KV, R2, etc.)
 *   • this.ctx — the execution context for background tasks
 */
export class MyWorker extends BasicWorker {
    /**
     * Override to allow additional method support for the worker.
     * GET and HEAD requests are always allowed.
     *
     * Default: GET, HEAD, OPTIONS
     *
     * For OPTIONS requests, the default response is:
     *     204 No Content
     *     "Allow" response header contains all allowed methods.
     *
     * If a requested method is not listed, the response is:
     *     405 Method Not Allowed
     *
     * If an allowed method is not implemented, the response is:
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

RouteWorker extends [BasicWorker](#arrow_right-basic-worker) to provide route-based request handling making it easy to define multiple endpoints in a single worker. It provides:

- Registering routes individually or in bulk.
- Matching incoming requests to registered routes by HTTP method and path.
- Support for URL path patterns using [path-to-regexp](https://github.com/pillarjs/path-to-regexp) syntax.
- Dispatching requests to either a callback function or another worker.

Example:

:page_facing_up: index.ts

```ts
import { BasicWorker, GET, PathParams, RouteWorker, TextResponse } from "@adonix.org/cloud-spark";

/**
 * An example worker with path routing.
 */
class GreetingWorker extends RouteWorker {
    /**
     * Called before request processing to enable worker
     * initialization without overriding the constructor.
     */
    protected override init(): void {
        /**
         * Example of path-to-regexp and local method routing.
         */
        this.route(GET, "/hello/:name", this.hello);

        /**
         * Example of simple path to a nested worker.
         */
        this.route(GET, "/goodbye", GoodbyeWorker);
    }

    /**
     * Path parameters are provided via path-to-regexp parsing
     * of the request path.
     *
     * For example, http://localhost:8787/hello/Inigo will yield
     * the text response "Hello Inigo!"
     */
    protected hello(params: PathParams): Promise<Response> {
        return this.response(TextResponse, `Hello ${params["name"]}!`);
    }
}

/**
 * An example nested BasicWorker.
 *
 * The original request, env, and ctx are passed to the nested
 * worker via the constructor.
 *
 * RouteWorkers may also be nested to access path parameters.
 */
class GoodbyeWorker extends BasicWorker {
    /**
     * GET handler for the "/goodbye" path.
     */
    protected override get(): Promise<Response> {
        return this.response(TextResponse, "Goodbye!");
    }
}

/**
 * Connects GreetingWorker to the Cloudflare runtime.
 */
export default GreetingWorker.ignite();
```

:bulb: Requests with no matching route fall back to the corresponding [BasicWorker](#arrow_right-basic-worker) method.

<br>

## :gear: Middleware

Middleware extends your worker’s behavior in a modular way. Each middleware can inspect the incoming request, return a custom response early, or modify the response produced by later handlers. It’s a simple way to add logic such as authentication checks, request logging, or response transformations without touching your core code.

CloudSpark includes built-in middleware for common functionality like caching and CORS, and you can easily create your own to handle behavior specific to your application.

### CORS

Register the built-in CORS middleware as follows:

:page_facing_up: index.ts

```ts
import { BasicWorker, cors } from "@adonix.org/cloud-spark";

class MyWorker extends BasicWorker {
    /**
     * Register middleware in the init method.
     */
    protected override init(): void {
        /**
         * Create and register the built-in CORS middleware
         * with default options:
         *
         * {
         *   allowedOrigins: ["*"],
         *   allowedHeaders: ["Content-Type"],
         *   exposedHeaders: [],
         *   allowCredentials: false,
         *   maxAge: 300,
         * }
         *
         */
        this.use(cors());

        /**
         * To override specific default CORS options:
         *
         * this.use(cors({ allowedOrigins: ["https://www.adonix.org"], maxAge: 604800 }));
         *
         */
    }
}
```

:bulb: The middleware adds CORS headers to the response **ONLY** if the request includes an `Origin` header.

### Cache

CloudSpark includes built-in caching middleware that stores responses for improving performance. Only responses that are safe to cache are stored, including:

- Responses to GET requests with a 200 OK status.
- Responses that specify a time-to-live via `Cache-Control` headers (max-age or s-maxage).
- Responses with `Vary` headers are fully supported, so the cache respects variations based on headers like `Accept-Language`.
- Responses that **do not** include user-specific data (such as Set-Cookie or requests with Authorization/Cookie headers).

Other types of responses (non-GET, errors, partial content, or requests marked no-store) are never cached. This ensures caching is safe and consistent with HTTP standards.

Register the built-in cache middleware as follows:

:page_facing_up: index.ts

```ts
import { BasicWorker, cache, CacheControl, JsonResponse, Time } from "@adonix.org/cloud-spark";

class MyWorker extends BasicWorker {
    /**
     * Enable middleware in the worker init method.
     */
    protected override init(): void {
        /**
         * Create and register the built-in cache middleware.
         */
        this.use(cache());

        /**
         * Optionally pass settings to the cache function:
         *
         * 	name — the name of the cache storage to use. If omitted,
         *         the default cache is used.
         *  getKey — a function that maps the incoming request to a
         *           cache key.
         *           Built-in key functions include:
         *               • sortSearchParams (Default)
         *               • stripSearchParams
         *
         * this.use(cache({
         *     name: "my-cache",
         *     getKey: stripSearchParams,
         * }));
         *
         */
    }

    /**
     * Create a cacheable response.
     */
    protected override get(): Promise<Response> {
        /**
         * Example JSON message.
         */
        const json = {
            message: "Hi from Cloud Spark!",
            timestamp: new Date().toLocaleString(),
        };

        /**
         * Cache the response for 10 seconds.
         */
        const cc: CacheControl = {
            "s-maxage": 10 * Time.Second,
        };

        return this.response(JsonResponse, json, cc);
    }
}

/**
 * Connects MyWorker to the Cloudflare runtime.
 */
export default MyWorker.ignite();
```

:bulb: The `cf-cache-status` response header will contain **HIT** when serving from the cache.

### WebSocket

The WebSocket middleware ensures upgrade requests are valid before they reach your handler. You can provide a path (default: `"/"`) and register multiple instances for multiple paths. Invalid upgrade requests are intercepted, and the correct error response is returned.

A valid WebSocket upgrade request must use the `GET` method and include the following:

| Header                | Value     |
| --------------------- | --------- |
| Connection            | Upgrade   |
| Upgrade               | websocket |
| Sec-WebSocket-Version | 13        |

Register the built-in websocket middleware as follows:

:page_facing_up: index.ts

```ts
import { GET, PathParams, RouteWorker, websocket } from "@adonix.org/cloud-spark";

class ChatWorker extends RouteWorker {
    /**
     * Register both the upgrade route and middleware.
     */
    protected override init(): void {
        /**
         * Route for WebSocket upgrades.
         */
        this.route(GET, "/chat/:room", this.upgrade);

        /**
         * Register WebSocket middleware to match the
         * upgrade route.
         */
        this.use(websocket("/chat/:room"));
    }

    /**
     * Handles WebSocket upgrade requests.
     *
     * Expects a DurableObject binding named CHAT
     * in wrangler.jsonc
     */
    protected upgrade(params: PathParams): Promise<Response> {
        /**
         * Get the Durable Object stub for the chat room
         * defined by the "room" path parameter.
         */
        const stub = this.env.CHAT_ROOM.getByName(params["room"]);

        /**
         * Request has already been validated by the
         * WebSocket middleware.
         */
        return stub.fetch(this.request);
    }
}

/**
 * Connects ChatWorker to the Cloudflare runtime.
 */
export default ChatWorker.ignite();
```

:bulb: See the complete WebSocket example [here](#left_right_arrow-web-sockets).

### Custom

Create custom middleware by implementing the [Middleware](https://github.com/adonix-org/cloud-spark/blob/main/src/interfaces/middleware.ts) interface and its single _handle_ method, then register it with your worker. Within your middleware, you can inspect requests and modify responses or short-circuit processing entirely.

Here is a simple example:

```ts
import { BadRequest, CopyResponse, Middleware, Worker } from "@adonix.org/cloud-spark";

/**
 * Custom middleware example.
 *
 * Demonstrates several key middleware capabilities:
 *   • Options via constructor parameters.
 *   • Inspection of the incoming request.
 *   • Short-circuiting by returning a response directly.
 *   • Modifying outgoing responses dispatched by the worker.
 */
class PoweredBy implements Middleware {
    /**
     * Optional constructor parameter to customize the "X-Powered-By" header.
     */
    constructor(private readonly name = "CloudSpark") {}

    public async handle(worker: Worker, next: () => Promise<Response>): Promise<Response> {
        /**
         * Extract the User-Agent header from the request.
         */
        const userAgent = worker.request.headers.get("User-Agent")?.trim();

        /**
         * If the User-Agent is missing, short-circuit by directly
         * returning 400 Bad Request.
         */
        if (!userAgent) {
            return new BadRequest("Missing User-Agent").response();
        }

        /**
         * Calls the next middleware or worker dispatch method.
         */
        const response = await next();

        /**
         * Wrap the response in a mutable copy.
         */
        const copy = new CopyResponse(response);

        /**
         * Append custom headers to the response.
         */
        copy.setHeader("X-User-Agent", userAgent);
        copy.setHeader("X-Powered-By", this.name);
        copy.setHeader("X-Processed-At", new Date().toUTCString());

        /**
         * Return the modified response.
         */
        return copy.response();
    }
}

/**
 * Factory function for registering the middleware, with an optional
 * name parameter. Workers interact with the `Middleware` interface,
 * and not the concrete implementation.
 *
 * Example:
 *   this.use(poweredby());
 *   this.use(poweredby("My Project Name"));
 */
export function poweredby(name?: string): Middleware {
    return new PoweredBy(name);
}
```

### Ordering

The order in which middleware is registered by a worker can matter depending on the implementation. It helps to visualize ordering as _top-down_ for requests and _bottom-up_ for responses.

Here is a what a full `GET` request flow with middleware `A`, `B`, and `C` could look like:

```typescript
                  Full

      Request               Response
         ↓     this.use(A)     ↑
         ↓     this.use(B)     ↑
         ↓     this.use(C)     ↑
           →      get()      →

```

Now imagine `B` middleware returns a response early and short-circuits the flow:

```typescript
            Short Circuit B

      Request               Response
         ↓     this.use(A)     ↑
         ↓     this.use(B)   →
               this.use(C)
                  get()
```

In this scenario, neither middleware `C` nor the worker's `get()` method executes. This is exactly what you want, for example, when using the [Cache](#cache) middleware. If a valid response is found in the cache, that response can and should be returned immediately.

However, this illustrates that different behavior can occur depending on the order of middleware registration.

We can use the built-in [Cache](#cache) and [CORS](#cors) middleware as a more concrete example:

```typescript
/**
 * This version results in CORS response headers stored in
 * the cache. On the first cacheable response, CORS middleware
 * applies its response headers BEFORE caching.
 */
this.use(cache());
this.use(cors());

/**
 * This version results in CORS response headers NOT stored
 * in the cache, which is likely preferred. Fresh CORS headers
 * are added to every response regardless of cache status.
 */
this.use(cors());
this.use(cache());
```

The difference in behavior becomes clear when disabling the CORS middleware on the worker. In the first version, CORS headers remain on all cached responses until the cached version expires. In the second version, disabling CORS takes effect immediately—all responses, cached or not, will no longer include CORS headers.

<br>

## :left_right_arrow: Web Sockets

Simplify [WebSocket](https://developers.cloudflare.com/durable-objects/best-practices/websockets/#_top) connection management with CloudSpark. Features include:

- Type-safe session metadata
- Support for [Hibernation WebSocket API](https://developers.cloudflare.com/durable-objects/best-practices/websockets/#durable-objects-hibernation-websocket-api) (recommended)
- Support for [Standard WebSocket API](https://developers.cloudflare.com/workers/runtime-apis/websockets/)
- [Middleware](#websocket) for Upgrade request validation
- Standardized WebSocketUpgrade response

The following is a simple chat with hibernation example:

:page_facing_up: wrangler.jsonc

```jsonc
/**
 * Remember to rerun 'wrangler types' after you change your
 * wrangler.json file.
 */
{
    "$schema": "node_modules/wrangler/config-schema.json",
    "name": "chat-room",
    "main": "src/index.ts",
    "compatibility_date": "2025-11-01",
    "observability": {
        "enabled": true,
    },
    "durable_objects": {
        "bindings": [
            {
                "name": "CHAT_ROOM",
                "class_name": "ChatRoom",
            },
        ],
    },
    "migrations": [
        {
            "tag": "v1",
            "new_sqlite_classes": ["ChatRoom"],
        },
    ],
}
```

:page_facing_up: index.ts

```ts
import { DurableObject } from "cloudflare:workers";

import {
    GET,
    PathParams,
    RouteWorker,
    websocket,
    WebSocketSessions,
    WebSocketUpgrade,
} from "@adonix.org/cloud-spark";

/**
 * Metadata attached to each session.
 */
interface Profile {
    name: string;
    lastActive: number;
}

export class ChatRoom extends DurableObject {
    /**
     * Manage all active connections for this room.
     */
    protected readonly sessions = new WebSocketSessions<Profile>();

    constructor(ctx: DurableObjectState, env: Env) {
        super(ctx, env);

        /**
         * Restore all active connections on wake from
         * hibernation.
         */
        this.sessions.restoreAll(this.ctx.getWebSockets());
    }

    public override fetch(request: Request): Promise<Response> {
        /**
         * For demo purposes, get the user's name from the `name`
         * query parameter.
         */
        const name = new URL(request.url).searchParams.get("name") ?? "Anonymous";

        /**
         * Create a new connection and initialize its `Profile`
         * attachment.
         */
        const con = this.sessions.create({
            name,
            lastActive: Date.now(),
        });

        /**
         * Accept the WebSocket with recommended hibernation enabled.
         *
         * To accept without hibernation, use `con.accept()` and
         * con.addEventListener() methods instead.
         */
        const client = con.acceptWebSocket(this.ctx);

        /**
         * Return the upgrade response with the client WebSocket.
         */
        return new WebSocketUpgrade(client).response();
    }

    /**
     * Send a message to all active sessions.
     */
    public broadcast(message: string): void {
        for (const session of this.sessions) {
            session.send(message);
        }
    }

    public override webSocketMessage(ws: WebSocket, message: string): void {
        /**
         * Get the sender's WebSocket session from the active sessions.
         */
        const con = this.sessions.get(ws);
        if (!con) return;

        /**
         * Update the sender's `Profile` with current `lastActive` time.
         */
        con.attach({ lastActive: Date.now() });

        /**
         * Broadcast the message to all sessions, prefixed with the
         * sender’s name.
         */
        this.broadcast(`${con.attachment.name}: ${message}`);
    }

    public override webSocketClose(ws: WebSocket, code: number, reason: string): void {
        /**
         * Closes and removes the WebSocket from active sessions.
         */
        this.sessions.close(ws, code, reason);
    }
}

class ChatWorker extends RouteWorker {
    protected override init(): void {
        /**
         * Define the WebSocket connection route.
         */
        this.route(GET, "/chat/:room", this.upgrade);

        /**
         * Register the middleware to validate WebSocket
         * connection requests.
         */
        this.use(websocket("/chat/:room"));
    }

    private upgrade(params: PathParams): Promise<Response> {
        /**
         * Get the Durable Object stub for the chat room
         * given by the "room" path parameter.
         */
        const stub = this.env.CHAT_ROOM.getByName(params["room"]);

        /**
         * Dispatch the WebSocket upgrade request to the
         * Durable Object.
         */
        return stub.fetch(this.request);
    }
}

/**
 * Connects ChatWorker to the Cloudflare runtime.
 */
export default ChatWorker.ignite();
```

:computer: To run this chat example locally:

```bash
wrangler dev
```

:bulb: Apps like [Postman](https://www.postman.com/downloads/) can be used to create and join local chat rooms for testing:

```
ws://localhost:8787/chat/fencing?name=Inigo
```

<br>

## :partly_sunny: Wrangler

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

<br>

## :link: Links

- [Cloudflare - Home](https://www.cloudflare.com)
- [Cloudflare - Dashboard](https://dash.cloudflare.com)
- [Wrangler](https://developers.cloudflare.com/workers/wrangler/)
- [Workers](https://developers.cloudflare.com/workers/)
- [Workers - SDK](https://github.com/cloudflare/workers-sdk)
- [Hibernation WebSocket API](https://developers.cloudflare.com/durable-objects/best-practices/websockets/#durable-objects-hibernation-websocket-api)
- [Standard WebSocket API](https://developers.cloudflare.com/workers/runtime-apis/websockets/)
- [Postman](https://www.postman.com/downloads/)
- [http-status-codes](https://github.com/prettymuchbryce/http-status-codes)
- [path-to-regexp](https://github.com/pillarjs/path-to-regexp)

##

### [:arrow_up:](#cloud-zap-spark)
