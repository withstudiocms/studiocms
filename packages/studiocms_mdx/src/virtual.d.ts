declare module 'studiocms:mdx/renderer' {
	export const renderMDX: typeof import('./lib/render').renderMDX;
	export default renderMDX;
}
