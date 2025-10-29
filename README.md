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

## :hammer_and_wrench: Basic Worker API

#### `getAllowedMethods(): Method[]`

Returns the HTTP methods supported by this Worker.

- **Default:** `[GET, HEAD, OPTIONS]`
- **Notes:** Subclasses must override to allow additional methods. Any request using a method not listed will automatically return a `405 Method Not Allowed` response.

#### `get(): Promise<Response>`

Override this method to handle `GET` requests.

- **Default behavior:** Returns a `404 Not Found`.
- **Notes:** Typically used to return content or data for read requests.

#### `head(): Promise<Response>`

Handles `HEAD` requests.

- **Default behavior:** Performs a `GET` request internally and strips the body.
- **Notes:** Rarely needs to be overridden; ensures compliance with RFC 7231.

#### `post(): Promise<Response>`

Override to handle `POST` requests.

- **Default behavior:** Returns `501 Method Not Implemented`.
- **Notes:** Ideal for form submissions, JSON payloads, or resource creation.

#### `put(): Promise<Response>`

Override to handle `PUT` requests.

- **Default behavior:** Returns `501 Method Not Implemented`.
- **Notes:** Used for full resource creation or replacement.

#### `patch(): Promise<Response>`

Override to handle `PATCH` requests.

- **Default behavior:** Returns `501 Method Not Implemented`.
- **Notes:** Used for partial updates to existing resources.

#### `delete(): Promise<Response>`

Override to handle `DELETE` requests.

- **Default behavior:** Returns `501 Method Not Implemented`.
- **Notes:** Used to remove resources.

#### `options(): Promise<Response>`

Override to handle `OPTIONS` requests.

- **Default behavior:** Returns `200 OK` with the `Allow` header listing supported methods.
- **Notes:** `GET`, `HEAD`, and `OPTIONS` are included by default.

<br>

## :twisted_rightwards_arrows: Route Worker

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
