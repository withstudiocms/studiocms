declare module 'studiocms:renderer/config' {
	const config: import('./src/index').StudioCMSRendererConfig;
	export default config;
}

declare module 'studiocms:renderer/astroMarkdownConfig' {
	const config: import('astro').AstroUserConfig['markdown'];
	export default config;
}

declare module 'studiocms:renderer' {
	export const StudioCMSRenderer: typeof import('./components/Renderer.js').default;
}

declare module 'studiocms:renderer/current' {
	const deModule: typeof import('./src/lib/contentRenderer.js').default;
	export default deModule;
	export const contentRenderer: typeof import('./src/lib/contentRenderer.js').contentRenderer;
}
