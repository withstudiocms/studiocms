import type { CurrentRESTAPIVersions } from '../consts.js';

export function makeAPIRoute(path: string) {
	return function api(route: string) {
		return `/studiocms_api/${path}/${route}`;
	};
}

// SDK Route Resolver
export const sdkRouteResolver = makeAPIRoute('sdk');
// API Route Resolver
export const apiRoute = makeAPIRoute('renderer');
// REST API Route Resolver
export const restRoute = (version: CurrentRESTAPIVersions) => makeAPIRoute(`rest/${version}`);
// V1 REST API Route Resolver
export const v1RestRoute = restRoute('v1');
