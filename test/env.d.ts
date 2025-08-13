export interface Env {
    MY_KV?: {
        get(key: string): Promise<string | null>;
        put(key: string, value: string): Promise<void>;
    };
    MY_SECRET?: string;
}
