export type DashboardPageLink = {
	/** Label for the link */
	label: string;
	/** URL to redirect to */
	link: string;
	/** Minimum permission level required to view the link (unknown/visitor/editor/admin) */
	minRole: 'unknown' | 'visitor' | 'editor' | 'admin';
	/** Icon to display for the link ( icon: 'data:image/svg+xml;base64,PH...) */
	icon: string;
	/** Type of link (link/dropdown) */
	type: 'link' | 'dropdown';
	/** Dropdown items for dropdown links (Requires `type: 'dropdown'`) */
	dropdownChildren?: DashboardPageLink[];
};

/**
 * @deprecated
 */
export type StudioCMSPluginOptions = {
	/**
	 * The package name of the plugin
	 */
	pkgname: string;
	/**
	 * The options for the plugin
	 */
	opts: {
		/**
		 * The label for the plugin (used in the dashboard)
		 */
		pluginLabel: string;
		/**
		 * The front-end navigation links for the plugin
		 */
		navigationLinks?: {
			text: string;
			slug: string;
		}[];
		/**
		 * Custom dashboard pages for the plugin
		 */
		dashboardPageLinks?: DashboardPageLink[];
		/**
		 * The custom renderer plugin path - This is used to replace the built-in Markdown renderer. Recommended for advanced users.
		 * ## Deprecated This option has moved to the StudioCMSRendererConfig.
		 */
		customRendererPluginPath?: string;
	};
};
