let PREFIX = '';
let PREFIX_ON = '';
let PREFIX_OFF = '';

export function init(prefix: string, on: string, off = '', fill = ' ') {
	PREFIX = `%c${prefix}%c${fill}`;
	PREFIX_ON = on;
	PREFIX_OFF = off;
}

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export function log(...args: any[]) {
	console.log(PREFIX + (args.shift() ?? ''), PREFIX_ON, PREFIX_OFF, ...args);
}
// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export function groupCollapsed(...args: any[]) {
	console.groupCollapsed(PREFIX + (args.shift() ?? ''), PREFIX_ON, PREFIX_OFF, ...args);
}
// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export function group(...args: any[]) {
	console.group(PREFIX + (args.shift() ?? ''), PREFIX_ON, PREFIX_OFF, ...args);
}
// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export function slog(...args: any[]) {
	console.log(...args);
}
// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export function sgroupCollapsed(...args: any[]) {
	console.groupCollapsed(...args);
}
// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export function sgroup(...args: any[]) {
	console.group(...args);
}
