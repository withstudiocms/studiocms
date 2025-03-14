import type { UiLanguageKeys } from 'studiocms:i18n';
import { StudioCMSRoutes, makeDashboardRoute } from 'studiocms:lib';
import logger from 'studiocms:logger';
import { type FinalDashboardPage, getPluginDashboardPages } from 'studiocms:plugin-helpers';
import type { HeroIconName } from '@studiocms/ui/components/Icon/iconType.js';
import { defaultLang } from '../../lib/i18n/config.js';

/**
 * Represents a link in the sidebar of the dashboard.
 */
interface SidebarLink {
	title?: string;
	key?: string;
	icon: HeroIconName;
	href: string;
}

/**
 * Represents the return value of the `getSidebarLinks` function.
 */
interface GetSidebarLinksReturn {
	baseLinks: SidebarLink[];
	editorLinks: SidebarLink[];
	adminLinks: SidebarLink[];
	ownerLinks: SidebarLink[];
}

/**
 * Generates a logger message indicating a mismatch between the page type and its array.
 *
 * @param title - The title of the plugin page.
 * @param slug - The slug of the plugin page.
 * @param admin - A boolean indicating if the page is an admin page.
 * @returns A string message indicating the mismatch and that the page will not be shown in the sidebar.
 */
const loggerMessage = (title: string, slug: string, admin: boolean) =>
	`Plugin page ${title} (${slug}) is not an ${
		admin ? 'admin' : 'user'
	} page but is part of the ${admin ? 'adminPages' : 'userPages'} array, this page will not be shown in the sidebar.`;

/**
 * Filters and processes a list of dashboard pages based on the user's admin status and permissions.
 *
 * @param pages - An array of `FinalDashboardPage` objects representing the pages to be filtered and processed.
 * @param admin - A boolean indicating whether the user is an admin.
 * @param permission - An array of strings representing the user's permissions. Possible values are 'owner', 'admin', 'editor', 'visitor', and 'none'.
 * @returns An array of `SidebarLink` objects representing the filtered and processed pages.
 */
function filterAndProcessPages(
	pages: FinalDashboardPage[],
	admin: boolean,
	permission: ('owner' | 'admin' | 'editor' | 'visitor' | 'none')[],
	lang: UiLanguageKeys
): SidebarLink[] {
	const filteredPages: SidebarLink[] = [];

	for (const { title: t, icon: ico, slug, requiredPermissions } of pages) {
		const href = makeDashboardRoute(slug);
		const icon = ico || 'cube-transparent';
		const title = t[lang] || t[defaultLang];

		if (admin) {
			if (requiredPermissions === undefined) {
				logger.warn(loggerMessage(title, slug, admin));
				continue;
			}
			if (requiredPermissions === 'none') {
				logger.warn(loggerMessage(title, slug, admin));
				continue;
			}
			if (requiredPermissions === 'visitor') {
				filteredPages.push({ title: title, icon, href });
				continue;
			}
			if (requiredPermissions === 'editor') {
				filteredPages.push({ title: title, icon, href });
				continue;
			}
		} else {
			if (requiredPermissions === 'admin') {
				logger.warn(loggerMessage(title, slug, admin));
				continue;
			}
			if (requiredPermissions === 'owner') {
				logger.warn(loggerMessage(title, slug, admin));
				continue;
			}
		}

		if (permission?.includes(requiredPermissions || 'none')) {
			filteredPages.push({ title: title, icon, href });
		}
	}

	return filteredPages;
}

/**
 * Generates the sidebar links for the dashboard based on the user's language and role.
 *
 * @param {UiLanguageKeys} lang - The language key for translations.
 * @returns {GetSidebarLinksReturn} An object containing arrays of sidebar links categorized by user roles:
 * - `baseLinks`: Links accessible to all users.
 * - `editorLinks`: Links accessible to users with editor role.
 * - `adminLinks`: Links accessible to users with admin role.
 * - `ownerLinks`: Links accessible to users with owner role.
 */
export function getSidebarLinks(lang: UiLanguageKeys): GetSidebarLinksReturn {
	// Get the dashboard pages from the plugins
	const { adminPages, userPages } = getPluginDashboardPages();

	// Base links
	const baseLinks: SidebarLink[] = [
		{
			key: 'dashboard-link-label',
			icon: 'home',
			href: StudioCMSRoutes.mainLinks.dashboardIndex,
		},
		...filterAndProcessPages(userPages, false, ['none', 'visitor'], lang),
	];

	// Editor links
	const editorLinks: SidebarLink[] = [
		{
			key: 'content-management-label',
			icon: 'pencil-square',
			href: StudioCMSRoutes.mainLinks.contentManagement,
		},
		...filterAndProcessPages(userPages, false, ['editor'], lang),
	];

	// Admin links
	const adminLinks: SidebarLink[] = [
		{
			key: 'user-management-label',
			icon: 'user-group',
			href: StudioCMSRoutes.mainLinks.userManagement,
		},
		...filterAndProcessPages(adminPages, true, ['admin'], lang),
	];

	// Owner links
	const ownerLinks: SidebarLink[] = [
		{
			key: 'site-configuration-label',
			icon: 'cog-6-tooth',
			href: StudioCMSRoutes.mainLinks.siteConfiguration,
		},
		{
			key: 'mailer-configuration-label',
			icon: 'inbox',
			href: StudioCMSRoutes.mainLinks.smtpConfiguration,
		},
		...filterAndProcessPages(adminPages, true, ['owner'], lang),
	];

	return {
		baseLinks,
		editorLinks,
		adminLinks,
		ownerLinks,
	};
}
