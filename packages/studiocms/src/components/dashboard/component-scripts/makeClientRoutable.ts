// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export function makeClientRoutable(func: any) {
	func;
	document.addEventListener('astro:page-load', () => {
		func;
	});
}
