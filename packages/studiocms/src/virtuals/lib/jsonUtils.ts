export function stringify(options: unknown) {
	return JSON.stringify(options);
}

export function stringifyMap(options: unknown) {
	if (!Array.isArray(options)) {
		throw new Error('Expected options to be an array');
	}
	const map = Array.from(options.entries());
	return JSON.stringify(map);
}
