export function makeAPIRoute(path: 'auth' | 'dashboard') {
	return function api(route: string) {
		return `/studiocms_api/${path}/${route}`;
	};
}
