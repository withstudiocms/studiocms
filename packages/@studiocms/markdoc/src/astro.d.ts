// Allow importing .astro components in TS files
declare module '*.astro' {
	import type { AstroComponentFactory } from 'astro';
	const component: AstroComponentFactory;
	export default component;
}
