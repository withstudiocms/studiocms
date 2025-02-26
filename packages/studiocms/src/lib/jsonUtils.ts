// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export function stringify(options: any) {
	return JSON.stringify(options);
}

// biome-ignore lint/suspicious/noExplicitAny: used to build a map for virtual modules
export function stringifyMap(options: any) {
	const map = Array.from(options.entries());
	return JSON.stringify(map);
}
