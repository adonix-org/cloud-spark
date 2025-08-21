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

export type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";

export interface BaseLogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    correlationId?: string;
}

export interface ErrorLogEntry extends BaseLogEntry {
    level: "error" | "fatal";
    error?: string;
    stack?: string;
}

export type LogEntry = BaseLogEntry | ErrorLogEntry;

export interface Logger {
    log(level: LogLevel, message: string, correlationId?: string, err?: Error): void;
    format(level: LogLevel, message: string): string;
    flush(): Promise<void>;

    debug(message: string, correlationId?: string): void;
    info(message: string, correlationId?: string): void;
    warn(message: string, correlationId?: string): void;
    error(message: string, error?: Error, correlationId?: string): void;
    fatal(message: string, error?: Error, correlationId?: string): void;
}

export class ConsoleLogger implements Logger {
    public log(level: LogLevel, message: string, correlationId?: string, err?: unknown): void {
        const error = err instanceof Error ? err.message : err ? String(err) : undefined;
        const stack = err instanceof Error ? err.stack : undefined;
        const entry: LogEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
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
            case "fatal":
                console.error(entry);
                break;
            default:
                console.log(entry);
                break;
        }
    }

    public format(_level: LogLevel, message: string): string {
        return message;
    }

    public async flush(): Promise<void> {
        return;
    }

    public debug(message: string, correlationId?: string): void {
        this.log("debug", message, correlationId);
    }

    public info(message: string, correlationId?: string): void {
        this.log("info", message, correlationId);
    }

    public warn(message: string, correlationId?: string): void {
        this.log("warn", message, correlationId);
    }

    public error(message: string, err?: Error, correlationId?: string): void {
        this.log("error", message, correlationId, err);
    }

    public fatal(message: string, err?: Error, correlationId?: string): void {
        this.log("fatal", message, correlationId, err);
    }
}
