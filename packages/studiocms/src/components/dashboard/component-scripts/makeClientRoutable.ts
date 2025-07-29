// biome-ignore lint/suspicious/noExplicitAny: this is a valid use case for explicit any.
export function makeClientRoutable(func: any) {
	func;
	document.addEventListener('astro:page-load', () => {
		func;
	});
}
