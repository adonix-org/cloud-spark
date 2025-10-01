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

export class CachePolicy {
    private rules: CacheRule[] = [];

    constructor(
        private worker: Worker,
        private getCached: () => Promise<Response | undefined>,
    ) {}

    public use(...rules: CacheRule[]): this {
        this.rules.push(...rules);
        return this;
    }

    public async execute(): Promise<Response | undefined> {
        const chain = this.rules.reduceRight(
            (next, rule) => () => rule.handle(this.worker, next),
            () => this.getCached(),
        );

        return await chain();
    }
}
