declare module 'studiocms:md/config' {
	export const config: import('./types').MarkdownSchemaOptions;
	export default config;
}

declare module 'studiocms:md/pre-render' {
	export const preRender: typeof import('./lib/markdown-prerender').preRender;
}
