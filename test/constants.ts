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

export class DefaultCorsWorker extends CorsWorker {
    public async fetch(): Promise<Response> {
        return new Response("OK");
    }
}

export class AllowOriginWorker extends DefaultCorsWorker {
    public override getAllowOrigins(): string[] {
        return [VALID_ORIGIN];
    }
}

export class EmptyCorsWorker extends DefaultCorsWorker {
    public override getAllowOrigins(): string[] {
        return [];
    }

    public override getAllowHeaders(): string[] {
        return [];
    }

    public override getAllowMethods(): Method[] {
        return [];
    }

    public override getExposeHeaders(): string[] {
        return [];
    }
}
