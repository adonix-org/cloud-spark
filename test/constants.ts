import { Method } from "../src/common";
import { CorsWorker } from "../src/cors-worker";

export const VALID_ORIGIN = "https://localhost";
export const INVALID_ORIGIN = "https://localhost.invalid";

export const GET_REQUEST = new Request(VALID_ORIGIN, {
    method: Method.GET,
});

export const GET_REQUEST_WITH_ORIGIN = new Request(VALID_ORIGIN, {
    method: Method.GET,
    headers: {
        Origin: VALID_ORIGIN,
    },
});

export class TestCorsWorker extends CorsWorker {
    public async fetch(): Promise<Response> {
        return new Response("OK");
    }
}

export class TestCorsWorkerOrigin extends TestCorsWorker {
    public override getAllowOrigins(): string[] {
        return [VALID_ORIGIN];
    }
}
