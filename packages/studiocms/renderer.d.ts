declare module 'studiocms:renderer/config' {
	const config: import('./src/schemas/config/rendererConfig.ts').StudioCMSRendererConfig;
	export default config;
}

declare module 'studiocms:renderer/astroMarkdownConfig' {
	const config: import('astro').AstroConfig['markdown'];
	export default config;
}

declare module 'studiocms:renderer' {
	export const StudioCMSRenderer: typeof import('./static/components/Renderer.astro').default;
}

declare module 'studiocms:renderer/current' {
	const deModule: typeof import('./src/renderer/contentRenderer.js').default;
	export default deModule;
	export const contentRenderer: typeof import('./src/renderer/contentRenderer.js').contentRenderer;
}

declare module 'studiocms:component-proxy' {
	export const createComponentProxy: (
		result: import('astro').SSRResult,
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		_components?: Record<string, any>
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	) => Record<string, any>;
	export const dedent: (str: string) => string;
	export const transformHTML: (
		html: string,
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		components: Record<string, any>,
		sanitizeOpts?: typeof import(
			'./src/schemas/config/studiocms-markdown-remark.ts'
		).StudioCMSSanitizeOptionsSchema._input
	) => Promise<string>;

	export const componentKeys: string[];
}
