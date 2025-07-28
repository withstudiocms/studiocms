declare module 'studiocms:mdx/renderer' {
	export const renderMDX: typeof import('./lib/render').renderMDX;
	export default renderMDX;
}

declare module 'virtual:studiocms/plugins/renderers' {
	export const studiocms_mdx: typeof import('./components/MDXRenderer.astro').default;
}
