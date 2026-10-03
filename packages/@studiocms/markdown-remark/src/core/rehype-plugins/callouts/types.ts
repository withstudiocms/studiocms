/**
 * Types for the callouts plugin, defining the structure of callout configurations, HTML tag names, and the overall plugin options. These types are used to ensure that the configuration for the callouts plugin is consistent and well-defined, allowing users to customize their callouts while maintaining type safety. The types include definitions for individual callout properties, as well as the complete configuration options for the plugin, providing a clear and structured way to manage callout settings in markdown content.
 */
export interface CalloutConfig {
	/**
	 * The default title for this callout type.
	 *
	 * @description
	 * For new callout types, if unset or set to an empty string,
	 * defaults to the callout type name.
	 */
	title?: string;

	/**
	 * The indicator icon for this callout type, which must be a string in SVG element format.
	 *
	 * @description
	 * You can view the icon sets used for specific themes on {@link https://icon-sets.iconify.design/ Iconify}:
	 * - {@link https://icon-sets.iconify.design/octicon/?keyword=octicon Octicons} icon set for GitHub
	 * - {@link https://icon-sets.iconify.design/lucide/?keyword=luci Lucide} icon set for Obsidian, VitePress
	 *
	 * For new callout types, if unset, this callout type will not display an indicator,
	 * even if {@link RehypeCalloutsOptions.showIndicator} is true.
	 *
	 * @example
	 * '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 6L9 17l-5-5"/></svg>'
	 *
	 */
	indicator?: string;

	/**
	 * The color(s) for this callout type, which must be a
	 * {@link https://developer.mozilla.org/en-US/docs/Web/CSS/color_value#syntax `<color>`} type string.
	 *
	 * @description
	 * For new callout types, if unset, the default color will be `#888`.
	 *
	 * @example
	 * 'rgb(8, 109, 221)': Suitable for both light and dark themes.
	 * ['#0969da', '#2f81f7']: First color for light theme, second for dark theme.
	 */
	color?: string | [string, string];
}

/**
 * HTML tag names configuration for the callouts plugin, allowing users to customize the semantic structure of the generated callout elements. This configuration includes properties for defining the tag names for various parts of the callout, such as the container, title, content, and icons. By customizing these tag names, users can ensure that the generated HTML structure of the callouts aligns with their desired semantics and styling preferences.
 */
export interface HtmlTagNamesConfig {
	/**
	 * Tag name for the outer container of **non-collapsible** callouts.
	 *
	 * @remarks
	 * For **collapsible** callouts, the tag name is fixed to 'details' for collapsibility and is not configurable.
	 * However, you can set {@link collapsibleContentTagName} to achieve the same semantic markup effect.
	 *
	 * @default
	 * 'div'
	 *
	 * @example
	 * 'blockquote' - For semantic HTML.
	 */
	nonCollapsibleContainerTagName?: string;

	/**
	 * Tag name for the title container of **non-collapsible** callouts.
	 *
	 * @remarks
	 * For **collapsible** callouts, the tag name is fixed to 'summary' for collapsibility and is not configurable.
	 *
	 * @default
	 * 'div'
	 */
	nonCollapsibleTitleTagName?: string;

	/**
	 * Tag name for the content container of **non-collapsible** callouts.
	 *
	 * @default
	 * 'div'
	 */
	nonCollapsibleContentTagName?: string;

	/**
	 * Tag name for the content container of **collapsible** callouts.
	 *
	 * @default
	 * 'div'
	 */
	collapsibleContentTagName?: string;

	/**
	 * Tag name for the icon container in both **collapsible and non-collapsible** callouts,
	 * including the fold icon in collapsible ones.
	 *
	 * @default
	 * 'div'
	 */
	iconTagName?: string;

	/**
	 * Tag name for the inner container of the title text
	 * in both **collapsible and non-collapsible** callouts.
	 *
	 * @default
	 * 'div'
	 */
	titleInnerTagName?: string;
}

/**
 * The type for the callout configuration, which includes properties such as the title, indicator, and color for each callout type. This type is used to define the properties of both default and custom callouts in the plugin's configuration.
 */
export interface RehypeCalloutsOptions<TCallouts, THtmlTagNames> {
	/**
	 * Specifies your desired callout theme to automatically apply its default types.
	 *
	 * @description
	 * Refer to the {@link https://github.com/lin-stephanie/rehype-callouts/tree/main/src/themes theme's source code} f
	 * or more details. Available themes:
	 * {@link https://github.com/orgs/community/discussions/16925 GitHub},
	 * {@link https://help.obsidian.md/Editing+and+formatting/Callouts Obsidian},
	 * {@link https://vitepress.dev/guide/markdown#github-flavored-alerts VitePress}.
	 *
	 * @default 'obsidian'
	 */
	theme?: 'github' | 'obsidian' | 'vitepress';

	/**
	 * Defines the properties for default and custom callouts.
	 *
	 * @description
	 * This object maps callout types to their properties.
	 * Each key represents a callout type, which can be either the default or newly defined,
	 * and the value is an object that specifies its properties.
	 *
	 * @remarks
	 * Key are case-insensitive, i.e., 'Note', 'NOTE' are equivalent to 'note'.
	 *
	 * @example
	 * {
	 *   "type": {
	 *     title: 'Type',
	 *     indicator: '<svg ...>...</svg>',
	 *     color: ['#0969da', '#2f81f7']
	 *   },
	 *   ...
	 * }
	 */
	callouts?: Record<string, TCallouts>;

	/**
	 * Configures aliases for callout types.
	 *
	 * @description
	 * It is an object containing the callout definitions,
	 * the key designates an existing or new callout type, and the value configures its properties.
	 *
	 * @remarks
	 * Key are case-insensitive, i.e., 'Note', 'NOTE' are equivalent to 'note'.
	 *
	 * @example
	 * {
	 *  'note': ['no', 'n'],
	 *  'tip': ['t'],
	 * }
	 */
	aliases?: Record<string, string[]>;

	/**
	 * Whether to display an type-specific icons before callout title.
	 *
	 * @remarks
	 * Since the {@link https://vitepress.dev/guide/markdown#github-flavored-alerts VitePress} theme
	 * lacks default indicator icons, setting this option to `true` will apply GitHub style icons.
	 *
	 * @default true
	 */
	showIndicator?: boolean;

	/**
	 * Configures HTML tag names for elements within the callout structure for semantic flexibility.
	 *
	 * @remark Customizing HTML tag names may impact the styling provided by the plugin.
	 * Check or adjust your styles accordingly.
	 */
	htmlTagNames?: THtmlTagNames;
}

/**
 * The type for the callout configurations, which includes properties such as the title, indicator, and color for each callout type. This type is used to define the properties of both default and custom callouts in the plugin's configuration.
 */
export type Callouts = Record<string, CalloutConfig>;

/**
 * The type for the default callout configurations. This type is derived from the `Callouts` type, but with all properties required and no `undefined` values allowed. This ensures that the default configuration for callouts is fully defined and does not contain any optional properties, providing a clear and consistent structure for the callout configurations used by the plugin.
 */
export type DefaultCallouts = Record<string, Required<CalloutConfig>>;

/**
 * The user configuration options for the callouts plugin. This type is derived from the `RehypeCalloutsOptions` type, but with all properties optional and allowing for `undefined` values. This allows users to provide only the specific configuration options they want to customize, while still benefiting from the default values provided by the plugin for any options they do not specify.
 */
export type UserOptions = RehypeCalloutsOptions<CalloutConfig, HtmlTagNamesConfig>;

/**
 * The complete configuration options for the callouts plugin, with all properties required and no `undefined` values allowed. This type is derived from the `RehypeCalloutsOptions` type, but with all properties set to their required versions. This ensures that the configuration for the callouts plugin is fully defined and does not contain any optional properties, providing a clear and consistent structure for the plugin's configuration.
 */
export type ConfigOptions = Required<
	RehypeCalloutsOptions<CalloutConfig, Required<HtmlTagNamesConfig>>
>;
