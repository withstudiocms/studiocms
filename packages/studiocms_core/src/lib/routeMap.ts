import Config from 'studiocms:config';
// import { dashboardPageLinks } from 'virtual:studiocms/pluginSystem';
import type { SideBarLink } from '../schemas';
import { makeAPIRoute } from './makeAPIRoute';
import urlGenFactory from './urlGen';

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

const authAPIRoute = makeAPIRoute('auth');
const dashboardAPIRoute = makeAPIRoute('dashboard');

export const StudioCMSRoutes = {
	mainLinks: {
		baseSiteURL: makeNonDashboardRoute(),
		dashboardIndex: makeDashboardRoute(),
		userProfile: makeDashboardRoute('profile/'),
		contentManagement: makeDashboardRoute('content-management/'),
		createPage: makeDashboardRoute('create-page/'),
		siteConfiguration: makeDashboardRoute('configuration/'),
		userManagement: makeDashboardRoute('user-management/'),
	},
	authLinks: {
		loginURL: makeDashboardRoute('login'),
		logoutURL: makeDashboardRoute('logout'),
		signupURL: makeDashboardRoute('signup'),
		loginAPI: authAPIRoute('login'),
		logoutAPI: authAPIRoute('logout'),
		registerAPI: authAPIRoute('register'),
		githubIndex: authAPIRoute('github'),
		githubCallback: authAPIRoute('github/callback'),
		discordIndex: authAPIRoute('discord'),
		discordCallback: authAPIRoute('discord/callback'),
		googleIndex: authAPIRoute('google'),
		googleCallback: authAPIRoute('google/callback'),
		auth0Index: authAPIRoute('auth0'),
		auth0Callback: authAPIRoute('auth0/callback'),
	},
	endpointLinks: {
		partials: {
			livePreviewBox: dashboardAPIRoute('liverender'),
		},
		config: {
			siteConfig: dashboardAPIRoute('config/site'),
			adminConfig: dashboardAPIRoute('config/admin'),
		},
		pages: {
			createPages: dashboardAPIRoute('pages/create'),
			editPages: dashboardAPIRoute('pages/edit'),
			deletePages: dashboardAPIRoute('pages/delete'),
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
	},
	{
		id: 'dashboard',
		href: StudioCMSRoutes.mainLinks.dashboardIndex,
		text: 'Dashboard',
		minPermissionLevel: 'visitor',
		icon: 'home',
	},
	{
		id: 'profile',
		href: StudioCMSRoutes.mainLinks.userProfile,
		text: 'User Profile',
		minPermissionLevel: 'visitor',
		icon: 'user',
	},
	{
		id: 'content-management',
		href: StudioCMSRoutes.mainLinks.contentManagement,
		text: 'Content Management',
		minPermissionLevel: 'editor',
		icon: 'plus',
	},
	{
		id: 'edit-pages',
		href: StudioCMSRoutes.mainLinks.createPage,
		text: 'Create Page',
		minPermissionLevel: 'editor',
		icon: 'pencil-square',
	},
	{
		id: 'site-config',
		href: StudioCMSRoutes.mainLinks.siteConfiguration,
		text: 'Site Configuration',
		minPermissionLevel: 'admin',
		icon: 'cog-6-tooth',
	},
	{
		id: 'user-management',
		href: StudioCMSRoutes.mainLinks.userManagement,
		text: 'User Management',
		minPermissionLevel: 'admin',
		icon: 'cog-6-tooth',
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
