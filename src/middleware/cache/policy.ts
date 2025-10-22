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

import { Worker } from "../../interfaces/worker";

import { CacheRule } from "./rules/interfaces";

/**
 * Represents a cache policy, defining the rules that determine
 * whether a cached response can be used.
 *
 * The `CachePolicy` executes its rules in order, passing the cached
 * response through a chain of validators. Each rule can:
 * - Return the cached response if eligible,
 * - Transform it (e.g., for `HEAD` requests), or
 * - Return `undefined` to indicate the cache cannot be used.
 *
 * The policy **does not fetch from origin**; it only evaluates the cache.
 */
export class CachePolicy {
    private readonly rules: CacheRule[] = [];

    /**
     * Adds one or more cache rules to the policy.
     *
     * @param rules - One or more `CacheRule` instances to apply.
     * @returns `this` for chaining.
     */
    public use(...rules: CacheRule[]): this {
        this.rules.push(...rules);
        return this;
    }

    /**
     * Executes the cache rules in order to determine cache eligibility.
     *
     * Each rule receives the cached response (or `undefined`) from the
     * next rule in the chain. If all rules pass, the cached response is returned.
     *
     * @param worker - The worker context containing the request.
     * @param getCached - Function returning the cached response if available.
     * @returns The cached response if allowed by all rules, or `undefined`
     *          if the cache cannot be used.
     */
    public async execute(
        worker: Worker,
        getCached: () => Promise<Response | undefined>,
    ): Promise<Response | undefined> {
        const chain = this.rules.reduceRight(
            (next, rule) => () => rule.apply(worker, next),
            () => getCached(),
        );
        return chain();
    }
}
