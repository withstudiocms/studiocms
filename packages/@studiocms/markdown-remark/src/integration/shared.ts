import type {
	AstroMarkdownConfig,
	StudioCMSMarkdownExtendedOptions,
	StudioCMSMarkdownProcessorOptions,
} from '../types.ts';

/**
 * Interface representing shared configuration for markdown.
 *
 * @interface Shared
 * @property {AstroMarkdownConfig} markdownConfig - The markdown configuration from AstroConfig.
 * @property {StudioCMSMarkdownExtendedOptions} studiocms - The extended markdown options specific to StudioCMS.
 */
export interface Shared {
	markdownConfig: AstroMarkdownConfig;
	studiocms: StudioCMSMarkdownExtendedOptions;
}

/**
 * A unique symbol used to store and access the shared configuration for markdown processing in the global scope. This allows different parts of the integration to access the same configuration without directly importing it, enabling better modularity and separation of concerns.
 *
 * @constant {symbol} symbol - The unique symbol used for the shared configuration.
 */
export const symbol: symbol = Symbol.for('@studiocms/markdown-remark:shared-config');

/**
 * A shared object that is either retrieved from the global scope using a symbol or
 * initialized as a new object with a `markdownConfig` property.
 *
 * @constant
 * @type {Shared}
 *
 * @remarks
 * The `@ts-expect-error` comments are used to suppress TypeScript errors related to the use of
 * the global scope and assignment within expressions. The `biome-ignore` comment is used
 * to suppress linting errors for the same reason.
 */
export const shared: Shared =
	// @ts-expect-error
	globalThis[symbol] ||
	// @ts-expect-error
	(globalThis[symbol] = {
		markdownConfig: {},
		studiocms: {},
	});

/**
 * Sets the shared configuration for markdown processing.
 */
export const setSharedConfig = ({ markdownConfig, studiocms }: Shared) => {
	shared.markdownConfig = markdownConfig;
	shared.studiocms = studiocms;
};

/**
 * Retrieves the complete markdown configuration for the StudioCMS Markdown Remark integration. This function combines the base markdown configuration from Astro with the extended options specific to StudioCMS, providing a comprehensive configuration object that can be used throughout the integration.
 *
 * @returns {StudioCMSMarkdownProcessorOptions} The complete markdown configuration for the integration, including both the base Astro markdown options and the extended StudioCMS options.
 */
export const getMDConfig = (): StudioCMSMarkdownProcessorOptions => ({
	...shared.markdownConfig,
	studiocms: shared.studiocms,
});
