/**
 * Options for configuring the StudioCMS Blog.
 */
export interface StudioCMSBlogOptions {
	/**
	 * Enable sitemap generation
	 * @default true
	 */
	sitemap?: boolean;

	/**
	 * Inject routes
	 * @default true
	 */
	injectRoutes?: boolean;

	/**
	 * The configuration for the blog
	 */
	blog?: {
		/**
		 * The title of the blog
		 */
		title?: string;

		/**
		 * Enable RSS feed
		 */
		enableRSS?: boolean;

		/**
		 * The route for the blog
		 * @default '/blog'
		 * @example '/news'
		 */
		route?: string;
	};
}
