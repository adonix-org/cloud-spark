# ⚡️ Cloud Spark

[![npm version](https://img.shields.io/npm/v/@adonix.org/cloud-spark.svg?color=blue)](https://www.npmjs.com/package/@adonix.org/cloud-spark)
[![Apache 2.0 License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://github.com/adonix-org/cloud-spark/blob/main/LICENSE)
[![Build](https://github.com/adonix-org/cloud-spark/actions/workflows/build.yml/badge.svg)](https://github.com/adonix-org/postrise/actions/workflows/build.yml)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=adonix-org_cloud-spark&metric=alert_status)](https://sonarcloud.io/summary/overall?id=adonix-org_cloud-spark&branch=main)
[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=adonix-org_cloud-spark&metric=security_rating)](https://sonarcloud.io/summary/overall?id=adonix-org_cloud-spark&branch=main)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=adonix-org_cloud-spark&metric=coverage)](https://sonarcloud.io/summary/overall?id=adonix-org_cloud-spark&branch=main)

**_Ignite_** your Cloudflare Workers with a type-safe library for rapid development.

If you are new to _Cloudflare Workers_, create a free [Cloudflare account](https://dash.cloudflare.com/sign-up) and install their command line interface [Wrangler](#cowboy_hat_face-wrangler). Detailed worker documentation can also be found [here](https://developers.cloudflare.com/workers/).

Then let's get started!

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
