import { defineUtility } from 'astro-integration-kit';
import { authAPIRoute, dashboardAPIRoute, routesDir } from './consts.js';
import { apiRoute, sdkRouteResolver, v1RestRoute } from './lib/index.js';
import type { Route } from './types.js';

type Options = {
	dbStartPage: boolean;
	shouldInject404Route: boolean;
	dashboardEnabled: boolean;
	dashboardRoute: (path: string) => string;
	developerConfig: {
		demoMode:
			| false
			| {
					username: string;
					password: string;
			  };
	};
	extraRoutes: Route[];

	authConfig: {
		enabled: boolean;
		providers: {
			github: boolean;
			discord: boolean;
			google: boolean;
			auth0: boolean;
			usernameAndPassword: boolean;
			usernameAndPasswordConfig: { allowUserRegistration: boolean };
		};
	};
};

export const routeHandler = defineUtility('astro:config:setup')((params, options: Options) => {
	const { injectRoute } = params;

	const {
		dbStartPage,
		shouldInject404Route,
		dashboardEnabled,
		dashboardRoute,
		developerConfig: { demoMode },
		extraRoutes,

		authConfig: {
			enabled: authEnabled,
			providers: {
				github: githubAPI,
				discord: discordAPI,
				google: googleAPI,
				auth0: auth0API,
				usernameAndPassword: usernameAndPasswordAPI,
				usernameAndPasswordConfig: { allowUserRegistration },
			},
		},
	} = options;

	const routes: Route[] = [
		{
			pattern: 'start',
			entrypoint: routesDir.fts('1-start.astro'),
			enabled: dbStartPage,
		},
		{
			pattern: 'start/1',
			entrypoint: routesDir.fts('1-start.astro'),
			enabled: dbStartPage,
		},
		{
			pattern: 'start/2',
			entrypoint: routesDir.fts('2-next.astro'),
			enabled: dbStartPage,
		},
		{
			pattern: 'done',
			entrypoint: routesDir.fts('3-done.astro'),
			enabled: dbStartPage,
		},
		{
			pattern: '404',
			entrypoint: routesDir.errors('404.astro'),
			enabled: shouldInject404Route && !dbStartPage,
		},
		{
			pattern: sdkRouteResolver('list-pages'),
			entrypoint: routesDir.sdk('list-pages.ts'),
			enabled: !dbStartPage,
		},
		{
			pattern: sdkRouteResolver('update-latest-version-cache'),
			entrypoint: routesDir.sdk('update-latest-version-cache.ts'),
			enabled: !dbStartPage,
		},
		{
			pattern: sdkRouteResolver('fallback-list-pages.json'),
			entrypoint: routesDir.sdk('fallback-list-pages.json.ts'),
			enabled: !dbStartPage,
		},
		{
			pattern: sdkRouteResolver('full-changelog.json'),
			entrypoint: routesDir.sdk('full-changelog.json.ts'),
			enabled: !dbStartPage,
		},
		{
			pattern: apiRoute('render'),
			entrypoint: routesDir.api('render.astro'),
			enabled: !dbStartPage,
		},
		{
			pattern: dashboardAPIRoute('live-render'),
			entrypoint: routesDir.dashApi('partials/LiveRender.astro'),
			enabled: dashboardEnabled && !dbStartPage,
		},
		{
			enabled: dashboardEnabled && !dbStartPage,
			pattern: dashboardAPIRoute('editor'),
			entrypoint: routesDir.dashApi('partials/Editor.astro'),
		},
		{
			enabled: dashboardEnabled && !dbStartPage,
			pattern: dashboardAPIRoute('search-list'),
			entrypoint: routesDir.dashApi('search-list.ts'),
		},
		{
			enabled: dashboardEnabled && !dbStartPage,
			pattern: dashboardAPIRoute('user-list-items'),
			entrypoint: routesDir.dashApi('partials/UserListItems.astro'),
		},
		{
			enabled: dashboardEnabled && !dbStartPage && authEnabled,
			pattern: dashboardAPIRoute('config'),
			entrypoint: routesDir.dashApi('config.ts'),
		},
		{
			enabled: dashboardEnabled && !dbStartPage && authEnabled,
			pattern: dashboardAPIRoute('profile'),
			entrypoint: routesDir.dashApi('profile.ts'),
		},
		{
			enabled: dashboardEnabled && !dbStartPage && authEnabled,
			pattern: dashboardAPIRoute('users'),
			entrypoint: routesDir.dashApi('users.ts'),
		},
		{
			enabled: dashboardEnabled && !dbStartPage && authEnabled,
			pattern: dashboardAPIRoute('content/page'),
			entrypoint: routesDir.dashApi('content/page.ts'),
		},
		{
			enabled: dashboardEnabled && !dbStartPage && authEnabled,
			pattern: dashboardAPIRoute('content/folder'),
			entrypoint: routesDir.dashApi('content/folder.ts'),
		},
		{
			enabled: dashboardEnabled && !dbStartPage && authEnabled,
			pattern: dashboardAPIRoute('content/diff'),
			entrypoint: routesDir.dashApi('content/diff.ts'),
		},
		{
			enabled: dashboardEnabled && !dbStartPage && authEnabled,
			pattern: dashboardAPIRoute('create-reset-link'),
			entrypoint: routesDir.dashApi('create-reset-link.ts'),
		},
		{
			enabled: dashboardEnabled && !dbStartPage && authEnabled,
			pattern: dashboardAPIRoute('reset-password'),
			entrypoint: routesDir.dashApi('reset-password.ts'),
		},
		{
			enabled: dashboardEnabled && !dbStartPage && authEnabled,
			pattern: dashboardAPIRoute('plugins/[plugin]'),
			entrypoint: routesDir.dashApi('plugins/[plugin].ts'),
		},
		{
			enabled: dbStartPage,
			pattern: dashboardAPIRoute('step-1'),
			entrypoint: routesDir.fts('api/step-1.ts'),
		},
		{
			enabled: dbStartPage,
			pattern: dashboardAPIRoute('step-2'),
			entrypoint: routesDir.fts('api/step-2.ts'),
		},
		{
			enabled: dashboardEnabled && !dbStartPage && authEnabled,
			pattern: dashboardAPIRoute('create-user'),
			entrypoint: routesDir.dashApi('create-user.ts'),
		},
		{
			enabled: dashboardEnabled && !dbStartPage && authEnabled,
			pattern: dashboardAPIRoute('create-user-invite'),
			entrypoint: routesDir.dashApi('create-user-invite.ts'),
		},
		{
			enabled: dashboardEnabled && !dbStartPage && authEnabled,
			pattern: dashboardAPIRoute('api-tokens'),
			entrypoint: routesDir.dashApi('api-tokens.ts'),
		},
		{
			enabled: dashboardEnabled && !dbStartPage && authEnabled,
			pattern: dashboardAPIRoute('verify-session'),
			entrypoint: routesDir.dashApi('verify-session.ts'),
		},
		{
			enabled: dashboardEnabled && !dbStartPage && authEnabled,
			pattern: dashboardAPIRoute('mailer/config'),
			entrypoint: routesDir.mailer('config.ts'),
		},
		{
			enabled: dashboardEnabled && !dbStartPage && authEnabled,
			pattern: dashboardAPIRoute('mailer/test-email'),
			entrypoint: routesDir.mailer('test-email.ts'),
		},
		{
			enabled: dashboardEnabled && !dbStartPage && authEnabled,
			pattern: dashboardAPIRoute('verify-email'),
			entrypoint: routesDir.dashApi('verify-email.ts'),
		},
		{
			enabled: dashboardEnabled && !dbStartPage && authEnabled,
			pattern: dashboardAPIRoute('email-notification-settings-site'),
			entrypoint: routesDir.dashApi('email-notification-settings-site.ts'),
		},
		{
			enabled: dashboardEnabled && !dbStartPage && authEnabled,
			pattern: dashboardAPIRoute('resend-verify-email'),
			entrypoint: routesDir.dashApi('resend-verify-email.ts'),
		},
		{
			enabled: dashboardEnabled && !dbStartPage && authEnabled,
			pattern: dashboardAPIRoute('update-user-notifications'),
			entrypoint: routesDir.dashApi('update-user-notifications.ts'),
		},
		{
			enabled: dashboardEnabled && !dbStartPage,
			pattern: dashboardRoute('/'),
			entrypoint: routesDir.dashRoute('index.astro'),
		},
		{
			enabled: dashboardEnabled && !dbStartPage,
			pattern: dashboardRoute('content-management'),
			entrypoint: routesDir.dashRoute('content-management/index.astro'),
		},
		{
			enabled: dashboardEnabled && !dbStartPage,
			pattern: dashboardRoute('content-management/create'),
			entrypoint: routesDir.dashRoute('content-management/createpage.astro'),
		},
		{
			enabled: dashboardEnabled && !dbStartPage,
			pattern: dashboardRoute('content-management/create-folder'),
			entrypoint: routesDir.dashRoute('content-management/createfolder.astro'),
		},
		{
			enabled: dashboardEnabled && !dbStartPage,
			pattern: dashboardRoute('content-management/edit'),
			entrypoint: routesDir.dashRoute('content-management/editpage.astro'),
		},
		{
			enabled: dashboardEnabled && !dbStartPage,
			pattern: dashboardRoute('content-management/edit-folder'),
			entrypoint: routesDir.dashRoute('content-management/editfolder.astro'),
		},
		{
			enabled: dashboardEnabled && !dbStartPage,
			pattern: dashboardRoute('content-management/diff'),
			entrypoint: routesDir.dashRoute('content-management/diff.astro'),
		},
		{
			enabled: dashboardEnabled && !dbStartPage,
			pattern: dashboardRoute('profile'),
			entrypoint: routesDir.dashRoute('profile.astro'),
		},
		{
			enabled: dashboardEnabled && !dbStartPage,
			pattern: dashboardRoute('configuration'),
			entrypoint: routesDir.dashRoute('configuration.astro'),
		},
		{
			enabled: dashboardEnabled && !dbStartPage,
			pattern: dashboardRoute('user-management'),
			entrypoint: routesDir.dashRoute('user-management/index.astro'),
		},
		{
			enabled: dashboardEnabled && !dbStartPage,
			pattern: dashboardRoute('user-management/edit'),
			entrypoint: routesDir.dashRoute('user-management/edit.astro'),
		},
		{
			enabled: dashboardEnabled && !dbStartPage && authEnabled,
			pattern: dashboardRoute('password-reset'),
			entrypoint: routesDir.dashRoute('password-reset.astro'),
		},
		{
			enabled: dashboardEnabled && !dbStartPage,
			pattern: dashboardRoute('plugins/[plugin]'),
			entrypoint: routesDir.dashRoute('plugins/[plugin].astro'),
		},
		{
			enabled: dashboardEnabled && !dbStartPage,
			pattern: dashboardRoute('smtp-configuration'),
			entrypoint: routesDir.dashRoute('smtp-configuration.astro'),
		},
		{
			enabled: dashboardEnabled && !dbStartPage,
			pattern: dashboardRoute('unverified-email'),
			entrypoint: routesDir.dashRoute('unverified-email.astro'),
		},
		{
			pattern: authAPIRoute('login'),
			entrypoint: routesDir.authAPI('login.ts'),
			enabled: usernameAndPasswordAPI,
		},
		{
			pattern: authAPIRoute('logout'),
			entrypoint: routesDir.authAPI('logout.ts'),
			enabled: dashboardEnabled && !options.dbStartPage,
		},
		{
			pattern: authAPIRoute('register'),
			entrypoint: routesDir.authAPI('register.ts'),
			enabled: usernameAndPasswordAPI && allowUserRegistration,
		},
		{
			pattern: authAPIRoute('github'),
			entrypoint: routesDir.authAPI('github/index.ts'),
			enabled: githubAPI,
		},
		{
			pattern: authAPIRoute('github/callback'),
			entrypoint: routesDir.authAPI('github/callback.ts'),
			enabled: githubAPI,
		},
		{
			pattern: authAPIRoute('discord'),
			entrypoint: routesDir.authAPI('discord/index.ts'),
			enabled: discordAPI,
		},
		{
			pattern: authAPIRoute('discord/callback'),
			entrypoint: routesDir.authAPI('discord/callback.ts'),
			enabled: discordAPI,
		},
		{
			pattern: authAPIRoute('google'),
			entrypoint: routesDir.authAPI('google/index.ts'),
			enabled: googleAPI,
		},
		{
			pattern: authAPIRoute('google/callback'),
			entrypoint: routesDir.authAPI('google/callback.ts'),
			enabled: googleAPI,
		},
		{
			pattern: authAPIRoute('auth0'),
			entrypoint: routesDir.authAPI('auth0/index.ts'),
			enabled: auth0API,
		},
		{
			pattern: authAPIRoute('auth0/callback'),
			entrypoint: routesDir.authAPI('auth0/callback.ts'),
			enabled: auth0API,
		},
		{
			pattern: authAPIRoute('forgot-password'),
			entrypoint: routesDir.authAPI('forgot-password.ts'),
			enabled: usernameAndPasswordAPI,
		},
		{
			pattern: dashboardRoute('login/'),
			entrypoint: routesDir.authPage('login.astro'),
			enabled: dashboardEnabled && !options.dbStartPage,
		},
		{
			pattern: dashboardRoute('logout/'),
			entrypoint: routesDir.authPage('logout.astro'),
			enabled: dashboardEnabled && !options.dbStartPage,
		},
		{
			pattern: dashboardRoute('signup/'),
			entrypoint: routesDir.authPage('signup.astro'),
			enabled: usernameAndPasswordAPI && allowUserRegistration,
		},
		{
			pattern: v1RestRoute('folders'),
			entrypoint: routesDir.v1Rest('folders/index.ts'),
			enabled: !dbStartPage && authEnabled && !demoMode,
		},
		{
			pattern: v1RestRoute('folders/[id]'),
			entrypoint: routesDir.v1Rest('folders/[id].ts'),
			enabled: !dbStartPage && authEnabled && !demoMode,
		},
		{
			pattern: v1RestRoute('pages'),
			entrypoint: routesDir.v1Rest('pages/index.ts'),
			enabled: !dbStartPage && authEnabled && !demoMode,
		},
		{
			pattern: v1RestRoute('pages/[id]'),
			entrypoint: routesDir.v1Rest('pages/[id]/index.ts'),
			enabled: !dbStartPage && authEnabled && !demoMode,
		},
		{
			pattern: v1RestRoute('pages/[id]/history'),
			entrypoint: routesDir.v1Rest('pages/[id]/history/index.ts'),
			enabled: !dbStartPage && authEnabled && !demoMode,
		},
		{
			pattern: v1RestRoute('pages/[id]/history/[diffid]'),
			entrypoint: routesDir.v1Rest('pages/[id]/history/[diffid].ts'),
			enabled: !dbStartPage && authEnabled && !demoMode,
		},
		{
			pattern: v1RestRoute('settings'),
			entrypoint: routesDir.v1Rest('settings/index.ts'),
			enabled: !dbStartPage && authEnabled && !demoMode,
		},
		{
			pattern: v1RestRoute('users'),
			entrypoint: routesDir.v1Rest('users/index.ts'),
			enabled: !dbStartPage && authEnabled && !demoMode,
		},
		{
			pattern: v1RestRoute('users/[id]'),
			entrypoint: routesDir.v1Rest('users/[id].ts'),
			enabled: !dbStartPage && authEnabled && !demoMode,
		},
		{
			pattern: v1RestRoute('public/pages'),
			entrypoint: routesDir.v1Rest('public/pages/index.ts'),
			enabled: !dbStartPage && authEnabled && !demoMode,
		},
		{
			pattern: v1RestRoute('public/pages/[id]'),
			entrypoint: routesDir.v1Rest('public/pages/[id].ts'),
			enabled: !dbStartPage && authEnabled && !demoMode,
		},
		{
			pattern: v1RestRoute('public/folders'),
			entrypoint: routesDir.v1Rest('public/folders/index.ts'),
			enabled: !dbStartPage && authEnabled && !demoMode,
		},
	];

	if (extraRoutes.length > 0) {
		routes.push(...extraRoutes);
	}

	// Inject Routes
	for (const { enabled, ...rest } of routes) {
		if (enabled) injectRoute({ ...rest, prerender: false });
	}
});
