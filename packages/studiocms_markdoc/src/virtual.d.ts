declare module 'studiocms:markdoc/renderer' {
	export const renderMarkDoc: typeof import('./lib/render').renderMarkDoc;
	export default renderMarkDoc;
}

declare module 'virtual:studiocms/plugins/renderers' {
	export const studiocms_markdoc: typeof import('./components/MarkDocRenderer.astro').default;
}
