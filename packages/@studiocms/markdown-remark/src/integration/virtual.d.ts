declare module 'studiocms:markdown-remark' {
	export const Markdown: typeof import('./components/virtual.js').Markdown;
	export const render: typeof import('./components/virtual.js').render;
	export type Props = import('./components/virtual.js').Props;
	export type RenderResponse = import('./components/virtual.js').RenderResponse;
}

declare module 'studiocms:markdown-remark/user-components' {
	export const componentKeys: string[];
}

declare module 'studiocms:markdown-remark/css' {
	/**
	 * @deprecated
	 *
	 * This is a Ambient module declaration for the virtual CSS module used to inject styles for the Markdown processor. It does not actually export any CSS, but it allows us to import the CSS in the virtual module without TypeScript throwing an error.
	 *
	 * **NOTE:** This module does not actually export any data directly, it uses side effects to inject the CSS ambiently. Importing this module will cause the CSS to be injected into the page, but it does not export any values that can be used in your code. The CSS is injected globally and will affect all Markdown content rendered by the processor.
	 *
	 * @example
	 * ```ts
	 * import 'studiocms:markdown-remark/css';
	 * ```
	 */
	const css: string;
	export default css;
}
