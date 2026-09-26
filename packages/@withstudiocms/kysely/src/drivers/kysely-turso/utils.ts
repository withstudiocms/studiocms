export function freeze<T>(thing: T): Readonly<T> {
	return Object.freeze(thing);
}

// lifted from `@tursodatabase/serverless/dist/session.js
const VALID_IDENTIIFER_REGEX = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;

// lifted from `@tursodatabase/serverless/dist/session.js
export function isValidIdentifier(str: string | undefined): str is string {
	return str != null && VALID_IDENTIIFER_REGEX.test(str);
}
