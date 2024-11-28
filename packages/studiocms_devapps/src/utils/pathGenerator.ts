const base = stripTrailingSlash(import.meta.env.BASE_URL);

/** Get the a root-relative URL path with the site’s `base` prefixed. */
export function pathWithBase(path: string) {
	let newpath = path;
	newpath = stripLeadingSlash(newpath);
	return newpath ? `${base}/${newpath}` : `${base}/`;
}

/** Ensure the passed path does not start with a leading slash. */
export function stripLeadingSlash(href: string) {
	let newhref = href;
	if (newhref[0] === '/') newhref = newhref.slice(1);
	return newhref;
}

/** Ensure the passed path does not end with a trailing slash. */
export function stripTrailingSlash(href: string) {
	let newhref = href;
	if (newhref[newhref.length - 1] === '/') newhref = newhref.slice(0, -1);
	return newhref;
}

/** Ensure the passed path starts with a leading slash. */
export function ensureLeadingSlash(href: string): string {
	let newhref = href;
	if (newhref[0] !== '/') newhref = `/${newhref}`;
	return newhref;
}

/** Endpoint path generator */
export const pathGenerator = (endpointPath: string) => {
	const newEndpointPath = stripTrailingSlash(endpointPath);
	return function pathBuilder(path: string): string {
		const newPath = stripLeadingSlash(path);
		return `${pathWithBase(newEndpointPath)}${ensureLeadingSlash(newPath)}`;
	};
};
