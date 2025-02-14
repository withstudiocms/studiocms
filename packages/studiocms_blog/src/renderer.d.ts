declare module 'studiocms:renderer' {
	export const StudioCMSRenderer: typeof import('studiocms/Renderer.astro').default;
}

declare module 'studiocms:renderer/current' {
	const deModule: typeof import('studiocms/contentRenderer.js').default;
	export default deModule;
	export const contentRenderer: typeof import('studiocms/contentRenderer.js').contentRenderer;
}
