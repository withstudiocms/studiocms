// const base = stripTrailingSlash(import.meta.env.BASE_URL);

/** Get the a root-relative URL path with the site’s `base` prefixed. */
export function pathWithBase(path: string) {
	let newPath = path;
	newPath = stripLeadingSlash(newPath);
	return newPath ? `/${newPath}` : '/';
}

/** Get the a root-relative file URL path with the site’s `base` prefixed. */
export function fileWithBase(path: string) {
	let newPath = path;
	newPath = stripLeadingSlash(newPath);
	return newPath ? `/${newPath}` : '/';
}
/** Ensure the passed path starts with a leading slash. */
export function ensureLeadingSlash(href: string): string {
	let newHref = href;
	if (newHref[0] !== '/') newHref = `/${newHref}`;
	return newHref;
}

/** Ensure the passed path ends with a trailing slash. */
export function ensureTrailingSlash(href: string): string {
	let newHref = href;
	if (newHref[newHref.length - 1] !== '/') newHref += '/';
	return newHref;
}

/** Ensure the passed path starts and ends with slashes. */
export function ensureLeadingAndTrailingSlashes(href: string): string {
	let newHref = href;
	newHref = ensureLeadingSlash(newHref);
	newHref = ensureTrailingSlash(newHref);
	return newHref;
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

/** Ensure the passed path does not start and end with slashes. */
export function stripLeadingAndTrailingSlashes(href: string): string {
	let newHref = href;
	newHref = stripLeadingSlash(newHref);
	newHref = stripTrailingSlash(newHref);
	return newHref;
}

/** Remove the extension from a path. */
export function stripHtmlExtension(path: string) {
	const pathWithoutTrailingSlash = stripTrailingSlash(path);
	return pathWithoutTrailingSlash.endsWith('.html') ? pathWithoutTrailingSlash.slice(0, -5) : path;
}

/** Add '.html' extension to a path. */
export function ensureHtmlExtension(path: string) {
	let newPath = path;
	newPath = stripLeadingAndTrailingSlashes(path);
	if (!newPath.endsWith('.html')) {
		newPath = path ? `${path}.html` : '/index.html';
	}
	return ensureLeadingSlash(newPath);
}
