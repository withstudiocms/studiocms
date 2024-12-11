import Config from 'virtual:studiocms/config';
// import { dashboardPageLinks } from 'virtual:studiocms/pluginSystem';
import type { SideBarLink } from '@studiocms/core/types';
import urlGenFactory from '../helpers/urlGen';

const {
	dashboardConfig: { dashboardRouteOverride },
} = Config;

export function getSluggedRoute(url: string, slug: string): string {
	return urlGenFactory(true, url + slug, dashboardRouteOverride);
}

export function getEditRoute(slug: string): string {
	return getSluggedRoute('edit/pages/', slug);
}

export function getDeleteRoute(slug: string): string {
	return getSluggedRoute('delete/pages/', slug);
}

export function makeNonDashboardRoute(route?: string | undefined): string {
	return urlGenFactory(false, route);
}

export function makeDashboardRoute(route?: string | undefined): string {
	return urlGenFactory(true, route, dashboardRouteOverride);
}

export function makeStudioCMSAPIRoute(route: string): string {
	return urlGenFactory(false, `studiocms_api/${route}`);
}

export const StudioCMSRoutes = {
	mainLinks: {
		baseSiteURL: makeNonDashboardRoute(),
		dashboardIndex: makeDashboardRoute(),
		userProfile: makeDashboardRoute('profile/'),
		pageNew: makeDashboardRoute('new/page/'),
		pageEdit: makeDashboardRoute('page-list/'),
		siteConfiguration: makeDashboardRoute('configuration/'),
		configurationAdmins: makeDashboardRoute('configuration/admins/'),
	},
	authLinks: {
		loginURL: makeDashboardRoute('login'),
		logoutURL: makeDashboardRoute('logout'),
		signupURL: makeDashboardRoute('signup'),
		loginAPI: makeStudioCMSAPIRoute('auth/login'), // /studiocms_api/auth/login
		logoutAPI: makeStudioCMSAPIRoute('auth/logout'), // /studiocms_api/auth/logout
		registerAPI: makeStudioCMSAPIRoute('auth/register'), // /studiocms_api/auth/register
		githubIndex: makeStudioCMSAPIRoute('auth/github'), // /studiocms_api/auth/github
		githubCallback: makeStudioCMSAPIRoute('auth/github/callback'), // /studiocms_api/auth/github/callback
		discordIndex: makeStudioCMSAPIRoute('auth/discord'), // /studiocms_api/auth/discord
		discordCallback: makeStudioCMSAPIRoute('auth/discord/callback'), // /studiocms_api/auth/discord/callback
		googleIndex: makeStudioCMSAPIRoute('auth/google'), // /studiocms_api/auth/google
		googleCallback: makeStudioCMSAPIRoute('auth/google/callback'), // /studiocms_api/auth/google/callback
		auth0Index: makeStudioCMSAPIRoute('auth/auth0'), // /studiocms_api/auth/auth0
		auth0Callback: makeStudioCMSAPIRoute('auth/auth0/callback'), // /studiocms_api/auth/auth0/callback
	},
	endpointLinks: {
		partials: {
			livePreviewBox: makeStudioCMSAPIRoute('dashboard/liverender'), // /studiocms_api/dashboard/liverender
		},
		config: {
			siteConfig: makeStudioCMSAPIRoute('dashboard/config/site'), // /studiocms_api/dashboard/config/site
			adminConfig: makeStudioCMSAPIRoute('dashboard/config/admin'), // /studiocms_api/dashboard/config/admin
		},
		pages: {
			createPages: makeStudioCMSAPIRoute('dashboard/pages/create'), // /studiocms_api/dashboard/pages/create
			editPages: makeStudioCMSAPIRoute('dashboard/pages/edit'), // /studiocms_api/dashboard/pages/edit
			deletePages: makeStudioCMSAPIRoute('dashboard/pages/delete'), // /studiocms_api/dashboard/pages/delete
		},
	},
};

// Add default dashboard page links
const defaultDashboardPageLinks: SideBarLink[] = [
	{
		id: 'home',
		href: StudioCMSRoutes.mainLinks.baseSiteURL,
		text: 'View Site',
		minPermissionLevel: 'unknown',
		icon: 'globe-alt',
		type: 'link',
	},
	{
		id: 'dashboard',
		href: StudioCMSRoutes.mainLinks.dashboardIndex,
		text: 'Dashboard',
		minPermissionLevel: 'visitor',
		icon: 'home',
		type: 'link',
	},
	{
		id: 'profile',
		href: StudioCMSRoutes.mainLinks.userProfile,
		text: 'User Profile',
		minPermissionLevel: 'visitor',
		icon: 'user',
		type: 'link',
	},
	{
		id: 'new-page',
		href: StudioCMSRoutes.mainLinks.pageNew,
		text: 'Create New Page',
		minPermissionLevel: 'editor',
		icon: 'plus',
		type: 'link',
	},
	{
		id: 'edit-pages',
		href: StudioCMSRoutes.mainLinks.pageEdit,
		text: 'Edit Pages',
		minPermissionLevel: 'editor',
		icon: 'pencil-square',
		type: 'link',
	},
	{
		id: 'site-config',
		href: StudioCMSRoutes.mainLinks.siteConfiguration,
		text: 'Site Configuration',
		minPermissionLevel: 'admin',
		icon: 'cog-6-tooth',
		type: 'link',
	},
];

// Side bar links map
const finalSideBarLinkMap: SideBarLink[] = [...defaultDashboardPageLinks];

export const sideBarLinkMap: SideBarLink[] = finalSideBarLinkMap;

// // Add custom dashboard page links
// const customDashboardPageLinks: SideBarLink[] = [];

// const customDashboardRoutes = Array.from(dashboardPageLinks.values());

// for (const links of customDashboardRoutes) {
// 	customDashboardPageLinks.push(...links);
// }

// const customDashboardDropdown = {
// 	id: 'integrations',
// 	href: '',
// 	text: 'Integration Configs',
// 	minPermissionLevel: 'editor',
// 	icon: 'question-mark-circle',
// 	type: 'dropdown',
// 	dropdownItems: customDashboardPageLinks,
// } satisfies SideBarLink;

// Merge custom dashboard page links
// if (customDashboardDropdown.dropdownItems.length > 0) {
// 	finalSideBarLinkMap.push(customDashboardDropdown);
// }
