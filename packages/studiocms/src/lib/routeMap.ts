import { dashboardConfig } from 'studiocms:config';
import { makeAPIRoute } from './makeAPIRoute.js';
import urlGenFactory from './urlGen.js';

const { dashboardRouteOverride } = dashboardConfig;

/**
 * Generates a slugged route by appending the provided slug to the given URL.
 *
 * @param url - The base URL to which the slug will be appended.
 * @param slug - The slug to append to the base URL.
 * @returns The complete slugged route as a string.
 */
export function getSluggedRoute(url: string, slug: string): string {
	return urlGenFactory(true, url + slug, dashboardRouteOverride);
}

/**
 * Generates the edit route for a given page slug.
 *
 * @param slug - The slug of the page to generate the edit route for.
 * @returns The edit route as a string.
 */
export function getEditRoute(slug: string): string {
	return getSluggedRoute('edit/pages/', slug);
}

/**
 * Generates a delete route for a given page slug.
 *
 * @param slug - The slug of the page to be deleted.
 * @returns The complete delete route for the specified page.
 */
export function getDeleteRoute(slug: string): string {
	return getSluggedRoute('delete/pages/', slug);
}

/**
 * Generates a non-dashboard route URL.
 *
 * @param route - The optional route string to be appended. If not provided, a default route will be used.
 * @returns The generated non-dashboard route URL as a string.
 */
export function makeNonDashboardRoute(route?: string | undefined): string {
	return urlGenFactory(false, route);
}

/**
 * Generates a URL for the dashboard route.
 *
 * @param route - An optional string representing the specific route to append to the dashboard URL.
 * @returns The generated dashboard URL as a string.
 */
export function makeDashboardRoute(route?: string | undefined): string {
	return urlGenFactory(true, route, dashboardRouteOverride);
}

/**
 * Represents the API route for authentication.
 *
 * This constant is generated using the `makeAPIRoute` function with 'auth' as the parameter.
 * It is used to define the endpoint for authentication-related API calls.
 */
const authAPIRoute = makeAPIRoute('auth');

/**
 * Represents the API route for the dashboard.
 * This constant is generated using the `makeAPIRoute` function with 'dashboard' as the parameter.
 */
const dashboardAPIRoute = makeAPIRoute('dashboard');

/**
 * Represents the API route for the SDK.
 *
 * This constant is generated using the `makeAPIRoute` function with the 'sdk' parameter.
 * It is used to define the endpoint for SDK-related API calls.
 */
const sdkRoute = makeAPIRoute('sdk');

/**
 * Represents the API route for the renderer service.
 *
 * This constant is generated using the `makeAPIRoute` function with 'renderer' as the argument.
 * It is used to define the endpoint for the renderer service in the application.
 */
const rendererRoute = makeAPIRoute('renderer');

/**
 * An object containing various route mappings for the StudioCMS application.
 */
export const StudioCMSRoutes = {
	mainLinks: {
		/**
		 * Base URL for the non-dashboard site.
		 */
		baseSiteURL: makeNonDashboardRoute(),

		/**
		 * URL for the dashboard index.
		 */
		dashboardIndex: makeDashboardRoute(),

		/**
		 * URL for the user profile page.
		 */
		userProfile: makeDashboardRoute('profile'),

		/**
		 * URL for the content management page.
		 */
		contentManagement: makeDashboardRoute('content-management'),

		/**
		 * URL for creating content in the content management page.
		 */
		contentManagementCreate: makeDashboardRoute('content-management/create'),

		/**
		 * URL for editing content in the content management page.
		 */
		contentManagementEdit: makeDashboardRoute('content-management/edit'),

		/**
		 * URL for creating a folder in the content management page.
		 */
		contentManagementFolderCreate: makeDashboardRoute('content-management/create-folder'),

		/**
		 * URL for editing a folder in the content management page.
		 */
		contentManagementFolderEdit: makeDashboardRoute('content-management/edit-folder'),

		/**
		 * URL for viewing content differences in the content management page.
		 */
		contentManagementDiff: makeDashboardRoute('content-management/diff'),

		/**
		 * URL for creating a new page.
		 */
		createPage: makeDashboardRoute('create-page'),

		/**
		 * URL for the site configuration page.
		 */
		siteConfiguration: makeDashboardRoute('configuration'),

		/**
		 * URL for the smtp configuration page.
		 */
		smtpConfiguration: makeDashboardRoute('smtp-configuration'),

		/**
		 * URL for the user management page.
		 */
		userManagement: makeDashboardRoute('user-management'),

		/**
		 * URL for editing user management details.
		 */
		userManagementEdit: makeDashboardRoute('user-management/edit'),

		/**
		 * URL for the plugins page.
		 */
		plugins: makeDashboardRoute('plugins/'),

		/**
		 * URL for unverified email page.
		 */
		unverifiedEmail: makeDashboardRoute('unverified-email'),

		passwordReset: makeDashboardRoute('password-reset'),
	},
	authLinks: {
		/**
		 * URL for the login page.
		 */
		loginURL: makeDashboardRoute('login'),

		/**
		 * URL for the logout page.
		 */
		logoutURL: makeDashboardRoute('logout'),

		/**
		 * URL for the signup page.
		 */
		signupURL: makeDashboardRoute('signup'),

		/**
		 * API route for logging in.
		 */
		loginAPI: authAPIRoute('login'),

		/**
		 * API route for logging out.
		 */
		logoutAPI: authAPIRoute('logout'),

		/**
		 * API route for registering a new user.
		 */
		registerAPI: authAPIRoute('register'),

		/**
		 * API route for OAuth authentication.
		 *
		 * @param provider - The name of the OAuth provider (e.g., 'github', 'google').
		 * @returns The complete API route for the specified OAuth provider.
		 */
		oAuthIndex: (provider: string) => authAPIRoute(provider),
		
		/**
		 * API route for OAuth callback.
		 */
		oAuthCallback: (provider: string) => authAPIRoute(`${provider}/callback`),

		forgotPasswordAPI: authAPIRoute('forgot-password'),
	},
	endpointLinks: {
		/**
		 * API route for searching lists.
		 */
		searchList: dashboardAPIRoute('search-list'),

		partials: {
			/**
			 * API route for live preview box rendering.
			 */
			livePreviewBox: dashboardAPIRoute('live-render'),

			/**
			 * API route for fetching user list items.
			 */
			userListItems: dashboardAPIRoute('user-list-items'),

			/**
			 * API route for rendering content.
			 */
			render: rendererRoute('render'),

			/**
			 * API route for the editor.
			 */
			editor: dashboardAPIRoute('editor'),
		},

		/**
		 * API route for fetching configuration.
		 */
		config: dashboardAPIRoute('config'),

		/**
		 * API route for fetching users.
		 */
		users: dashboardAPIRoute('users'),

		/**
		 * API route for fetching user profile.
		 */
		profile: dashboardAPIRoute('profile'),

		/**
		 * API route for creating a password reset link.
		 */
		createResetLink: dashboardAPIRoute('create-reset-link'),

		/**
		 * API route for resetting password.
		 */
		resetPassword: dashboardAPIRoute('reset-password'),

		content: {
			/**
			 * API route for fetching page content.
			 */
			page: dashboardAPIRoute('content/page'),

			/**
			 * API route for fetching folder content.
			 */
			folder: dashboardAPIRoute('content/folder'),

			diff: dashboardAPIRoute('content/diff'),
		},

		/**
		 * API route for fetching plugins.
		 */
		plugins: dashboardAPIRoute('plugins/'),

		newUsers: {
			/**
			 * API route for creating a new user.
			 */
			create: dashboardAPIRoute('create-user'),

			/**
			 * API route for inviting a new user.
			 */
			invite: dashboardAPIRoute('create-user-invite'),
		},

		/**
		 * API route for fetching API tokens.
		 */
		apiTokens: dashboardAPIRoute('api-tokens'),

		/**
		 * API route for verifying a user session.
		 */
		verifySession: dashboardAPIRoute('verify-session'),

		/**
		 * API routes for the mailer configuration.
		 */
		mailer: {
			/**
			 * API route for updating the mailer configuration
			 */
			config: dashboardAPIRoute('mailer/config'),

			/**
			 * API route for testing the mailer configuration.
			 */
			testEmail: dashboardAPIRoute('mailer/test-email'),
		},

		verifyEmail: dashboardAPIRoute('verify-email'),

		emailNotificationSettingsSite: dashboardAPIRoute('email-notification-settings-site'),

		resendVerificationEmail: dashboardAPIRoute('resend-verify-email'),

		updateUserNotifications: dashboardAPIRoute('update-user-notifications'),
	},
	sdk: {
		/**
		 * SDK route for listing pages.
		 */
		pages: sdkRoute('list-pages'),

		/**
		 * SDK route for fetching fallback list of pages.
		 */
		fallback_pages: sdkRoute('fallback-list-pages.json'),

		/**
		 * SDK route for updating the latest version cache.
		 */
		updateLatestVersionCache: sdkRoute('update-latest-version-cache'),
	},
	fts: {
		/**
		 * API route for step 1 of the FTS process.
		 */
		step1: dashboardAPIRoute('step-1'),

		/**
		 * API route for step 2 of the FTS process.
		 */
		step2: dashboardAPIRoute('step-2'),
	},
};
