export function makeAPIRoute(path: string) {
	return function api(route: string) {
		return `/studiocms_api/${path}/${route}`;
	};
}
