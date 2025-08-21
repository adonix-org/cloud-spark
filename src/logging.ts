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

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface BaseLogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    correlationId?: string;
}

export interface ErrorLogEntry extends BaseLogEntry {
    level: "error";
    error?: string;
    stack?: string;
}

export interface DebugLogEntry extends BaseLogEntry {
    level: "debug";
    object?: object;
}

export type LogEntry = BaseLogEntry | ErrorLogEntry | DebugLogEntry;

export interface Logger {
    log(
        level: LogLevel,
        message: string,
        correlationId?: string,
        err?: Error,
        object?: object
    ): void;
    format(level: LogLevel, message: string): string;
    flush(): Promise<void>;

    debug(message: string, object?: object, correlationId?: string): void;
    info(message: string, correlationId?: string): void;
    warn(message: string, correlationId?: string): void;
    error(message: string, error?: unknown, correlationId?: string): void;
}

export class ConsoleLogger implements Logger {
    private _level: LogLevel = "error";

    public set level(level: LogLevel) {
        this._level = level;
    }

    public get level(): LogLevel {
        return this._level;
    }

    public log(
        level: LogLevel,
        message: string,
        correlationId?: string,
        err?: unknown,
        object?: object
    ): void {
        const error = err instanceof Error ? err.message : err ? String(err) : undefined;
        const stack = err instanceof Error ? err.stack : undefined;
        const entry: LogEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            ...(object ? { object } : {}),
            ...(error ? { error, stack } : {}),
            ...(correlationId ? { correlationId } : {}),
        };

        switch (level) {
            case "debug":
                console.debug(entry);
                break;
            case "info":
                console.info(entry);
                break;
            case "warn":
                console.warn(entry);
                break;
            case "error":
                console.error(entry);
                break;
            default:
                console.log(entry);
        }
    }

    public format(_level: LogLevel, message: string): string {
        return message;
    }

    public async flush(): Promise<void> {
        return;
    }

    public debug(message: string, object?: object, correlationId?: string): void {
        this.log("debug", message, correlationId, undefined, object);
    }

    public info(message: string, correlationId?: string): void {
        this.log("info", message, correlationId);
    }

    public warn(message: string, correlationId?: string): void {
        this.log("warn", message, correlationId);
    }

    public error(message: string, err?: unknown, correlationId?: string): void {
        this.log("error", message, correlationId, err);
    }
}
