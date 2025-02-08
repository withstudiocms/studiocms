declare module 'studiocms:renderer/config' {
	const config: import('./src/index').StudioCMSRendererConfig;
	export default config;
}

declare module 'studiocms:renderer/astroMarkdownConfig' {
	const config: import('astro').AstroConfig['markdown'];
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

declare module 'studiocms:component-proxy' {
	export const createComponentProxy: (
		result: import('astro').SSRResult,
		_components?: Record<string, any>
	) => Record<string, any>;
	export const dedent: (str: string) => string;
	export const transformHTML: (
		html: string,
		components: Record<string, any>,
		sanitizeOpts?: SanitizeOptions
	) => Promise<string>;

	export const componentKeys: string[];
}

declare module 'studiocms:renderer/markdown-remark/css' {}
