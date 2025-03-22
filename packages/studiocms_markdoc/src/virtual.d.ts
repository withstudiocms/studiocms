declare module 'studiocms:markdoc/renderer' {
	export const renderMarkDoc: typeof import('./lib/render').renderMarkDoc;
	export default renderMarkDoc;
}
