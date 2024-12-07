declare module 'studiocms:renderer' {
	const StudioCMSRenderer: typeof import('./src/components/index').StudioCMSRenderer;
}

declare module 'studiocms:renderer/config' {
	const Config: import('./src/index').StudioCMSRendererConfig;
	export default Config;
}

declare module 'studiocms:renderer/astroMarkdownConfig' {
	const markdownConfig: import('astro').AstroConfig['markdown'];
	export default markdownConfig;
}
