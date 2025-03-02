declare module 'studiocms:renderer/config' {
	const config: import('./schemas/config/rendererConfig.ts').StudioCMSRendererConfig;
	export default config;
}

declare module 'studiocms:renderer/astroMarkdownConfig' {
	const config: import('astro').AstroConfig['markdown'];
	export default config;
}

declare module 'studiocms:renderer' {
	export const StudioCMSRenderer: typeof import('./components/Renderer.astro').default;
}

declare module 'studiocms:renderer/current' {
	const deModule: typeof import('./lib/renderer/contentRenderer.js').default;
	export default deModule;
	export const contentRenderer: typeof import('./lib/renderer/contentRenderer.js').contentRenderer;
}

declare module 'studiocms:component-proxy' {
	export const componentKeys: string[];
}
