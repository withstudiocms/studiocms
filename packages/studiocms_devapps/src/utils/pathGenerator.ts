const base = stripTrailingSlash(import.meta.env.BASE_URL);

/** Get the a root-relative URL path with the site’s `base` prefixed. */
export function pathWithBase(path: string) {
	let newPath = path;
	newPath = stripLeadingSlash(newPath);
	return newPath ? `${base}/${newPath}` : `${base}/`;
}

/** Ensure the passed path does not start with a leading slash. */
export function stripLeadingSlash(href: string) {
	let newHref = href;
	if (newHref[0] === '/') newHref = newHref.slice(1);
	return newHref;
}

/** Ensure the passed path does not end with a trailing slash. */
export function stripTrailingSlash(href: string) {
	let newHref = href;
	if (newHref[newHref.length - 1] === '/') newHref = newHref.slice(0, -1);
	return newHref;
}

/** Ensure the passed path starts with a leading slash. */
export function ensureLeadingSlash(href: string): string {
	let newHref = href;
	if (newHref[0] !== '/') newHref = `/${newHref}`;
	return newHref;
}

/** Endpoint path generator */
export const pathGenerator = (endpointPath: string) => {
	const newEndpointPath = stripTrailingSlash(endpointPath);
	return function pathBuilder(path: string): string {
		const newPath = stripLeadingSlash(path);
		return `${pathWithBase(newEndpointPath)}${ensureLeadingSlash(newPath)}`;
	};
};
