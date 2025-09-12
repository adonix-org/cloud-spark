import { Method } from "../constants/http";


/**
 * A set containing all supported HTTP methods.
 *
 * Useful for runtime checks like validating request methods.
 */
const METHOD_SET: Set<string> = new Set(Object.values(Method));

/**
 * Type guard that checks if a string is a valid HTTP method.
 *
 * @param value - The string to test.
 * @returns True if `value` is a recognized HTTP method.
 */
export function isMethod(value: string): value is Method {
    return METHOD_SET.has(value);
}
