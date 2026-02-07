import type { CurrentRESTAPIVersions } from '../../consts.js';

/**
 * Creates a function that generates API route strings.
 *
 * @param path - The base path for the API route.
 * @returns A function that takes a route string and returns the full API route.
 *
 * @example
 * ```typescript
 * const apiRoute = makeAPIRoute('users');
 * const fullRoute = apiRoute('profile'); // Returns '/studiocms_api/users/profile'
 * ```
 */
export function makeAPIRoute(path: string) {
	return function api(route: string) {
		return `/studiocms_api/${path}/${route}`;
	};
}

/**
 * Resolves the API route for the SDK.
 *
 * This function uses the `makeAPIRoute` utility to generate the API route
 * specifically for the SDK.
 *
 * @constant
 */
export const sdkRouteResolver = makeAPIRoute('sdk');

/**
 * Creates an API route for the 'renderer' service.
 *
 * This function utilizes the `makeAPIRoute` utility to generate
 * a route specifically for the 'renderer' service.
 *
 * @constant
 */
export const apiRoute = makeAPIRoute('renderer');

/**
 * Generates a REST API route string for the specified version.
 *
 * @param version - The version of the REST API.
 * @returns The complete API route string for the given version.
 */
export const restRoute = (version: CurrentRESTAPIVersions) => makeAPIRoute(`rest/${version}`);

/**
 * Creates a REST API route for version 1.
 *
 * @constant
 */
export const v1RestRoute = restRoute('v1');
