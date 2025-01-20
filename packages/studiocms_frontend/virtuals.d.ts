declare module 'studiocms:lib' {
	export const HeadConfigSchema: typeof import(
		'../studiocms_core/src/lib/head.ts'
	).HeadConfigSchema;
	export const createHead: typeof import('../studiocms_core/src/lib/head.ts').createHead;
	export const headDefaults: typeof import(
		'../studiocms_core/src/lib/headDefaults.ts'
	).headDefaults;
	export const stringify: typeof import('../studiocms_core/src/lib/jsonUtils.ts').stringify;
	export const stringifyMap: typeof import('../studiocms_core/src/lib/jsonUtils.ts').stringifyMap;
	export const pathWithBase: typeof import(
		'../studiocms_core/src/lib/pathGenerators.ts'
	).pathWithBase;
	export const fileWithBase: typeof import(
		'../studiocms_core/src/lib/pathGenerators.ts'
	).fileWithBase;
	export const ensureLeadingSlash: typeof import(
		'../studiocms_core/src/lib/pathGenerators.ts'
	).ensureLeadingSlash;
	export const ensureTrailingSlash: typeof import(
		'../packages/studiocms_core/src/lib/pathGenerators.ts'
	).ensureTrailingSlash;
	export const ensureLeadingSlashAndTrailingSlash: typeof import(
		'../studiocms_core/src/lib/pathGenerators.ts'
	).ensureLeadingSlashAndTrailingSlash;
	export const stripLeadingSlash: typeof import(
		'../studiocms_core/src/lib/pathGenerators.ts'
	).stripLeadingSlash;
	export const stripTrailingSlash: typeof import(
		'../studiocms_core/src/lib/pathGenerators.ts'
	).stripTrailingSlash;
	export const stripLeadingSlashAndTrailingSlash: typeof import(
		'../packages/studiocms_core/src/lib/pathGenerators.ts'
	).stripLeadingSlashAndTrailingSlash;
	export const stripHtmlExtension: typeof import(
		'../studiocms_core/src/lib/pathGenerators.ts'
	).stripHtmlExtension;
	export const ensureHtmlExtension: typeof import(
		'../studiocms_core/src/lib/pathGenerators.ts'
	).ensureHtmlExtension;
	export const removeLeadingTrailingSlashes: typeof import(
		'../studiocms_core/src/lib/removeLeadingTrailingSlashes.ts'
	).removeLeadingTrailingSlashes;
	export const getSluggedRoute: typeof import(
		'../studiocms_core/src/lib/routeMap.ts'
	).getSluggedRoute;
	export const getEditRoute: typeof import('../studiocms_core/src/lib/routeMap.ts').getEditRoute;
	export const getDeleteRoute: typeof import(
		'../studiocms_core/src/lib/routeMap.ts'
	).getDeleteRoute;
	export const makeNonDashboardRoute: typeof import(
		'../studiocms_core/src/lib/routeMap.ts'
	).makeNonDashboardRoute;
	export const makeDashboardRoute: typeof import(
		'../studiocms_core/src/lib/routeMap.ts'
	).makeDashboardRoute;
	export const StudioCMSRoutes: typeof import(
		'../studiocms_core/src/lib/routeMap.ts'
	).StudioCMSRoutes;
	export const sideBarLinkMap: typeof import(
		'../studiocms_core/src/lib/routeMap.ts'
	).sideBarLinkMap;
	export const urlGenFactory: typeof import('../studiocms_core/src/lib/urlGen.ts').urlGenFactory;
	export type HeadConfig = import('../studiocms_core/src/lib/head.ts').HeadConfig;
	export type HeadUserConfig = import('../packages/studiocms_core/src/lib/head.ts').HeadUserConfig;
}

declare module 'studiocms:sdk' {
	const defaultExport: typeof import('../studiocms_core/src/sdk-utils/index.ts').default;
	export default defaultExport;
}

declare module 'studiocms:components' {
	/**
	 * # Avatar Component used for the Navigation Component
	 *
	 * This component has no props and will render the current user avatar or a default avatar if no user is logged in based on the Astro.locals object
	 */
	export const Avatar: typeof import('../studiocms_core/src/components/Avatar.astro').default;
	/**
	 * # Formatted Date Component used for rendering dates in a human readable format
	 *
	 * This components locale will adapt to the current configuration of the StudioCMS 'dateLocale' settings configuration option.
	 *
	 * @props {string(Date)} date - Date String
	 */
	export const FormattedDate: typeof import(
		'../studiocms_core/src/components/FormattedDate.astro'
	).default;
	/**
	 * # Generic Header Component <GenericHeader />
	 *
	 * Generic Header Component used for rendering a generic header with a title and description from StudioCMS
	 */
	export const GenericHeader: typeof import(
		'../studiocms_core/src/components/GenericHeader.astro'
	).default;
	/**
	 * # Navigation Component used for rendering StudioCMS User Facing Navigation
	 *
	 * This component is a helper component that will render the StudioCMS user facing navigation to assist in easy navigation of your built front-end site
	 *
	 * @props {topLevelLinkCount} number - Number of top level links to display before collapsing into a dropdown
	 * @props {hideAvatar} boolean - Hide the user avatar/Login button in the navigation bar
	 */
	export const Navigation: typeof import(
		'../studiocms_core/src/components/Navigation.astro'
	).default;
	/**
	 * Component used for the generator meta tag
	 *
	 * Useful for providing the current version of the StudioCMS package in the meta tags of your site
	 */
	export const Generator: typeof import('../studiocms_core/src/components/Generator.astro').default;
}

declare module 'studiocms:config' {
	const defaultExport: import('../studiocms_core/src/schemas/config/index.ts').StudioCMSConfig;
	export default defaultExport;
	export const config: import('../studiocms_core/src/schemas/config/index.ts').StudioCMSConfig;
	export const dashboardConfig: import(
		'../studiocms_core/src/schemas/config/index.ts'
	).StudioCMSConfig['dashboardConfig'];
	export const AuthConfig: import(
		'../studiocms_core/src/schemas/config/index.ts'
	).StudioCMSConfig['dashboardConfig']['AuthConfig'];
	export const developerConfig: import(
		'../studiocms_core/src/schemas/config/index.ts'
	).StudioCMSConfig['dashboardConfig']['developerConfig'];
	export const defaultFrontEndConfig: import(
		'../studiocms_core/src/schemas/config/index.ts'
	).StudioCMSConfig['defaultFrontEndConfig'];
	export const sdk: import('../studiocms_core/src/schemas/config/index.ts').StudioCMSConfig['sdk'];
}

declare module 'studiocms:renderer' {
	export const StudioCMSRenderer: typeof import(
		'../studiocms_renderers/components/Renderer'
	).default;
}
