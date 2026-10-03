import { defaultLang, type UiLanguageKeys } from 'studiocms:i18n';
import { makeDashboardRoute, StudioCMSRoutes } from 'studiocms:lib';
import { type FinalDashboardPage, getPluginDashboardPages } from 'studiocms:plugin-helpers';
import type { AvailableIcons } from 'studiocms:ui/icons';

/**
 * SidebarLink is a custom web component that renders a link with an icon for use in the dashboard sidebar. It manages its active state based on the current URL and supports keyboard navigation and accessibility features.
 */
export type OutlinedIcons = Exclude<AvailableIcons, `${string}-solid`>;

/**
 * Represents a link in the sidebar of the dashboard.
 */
interface SidebarLink {
	title?: string;
	key?: string;
	icon: OutlinedIcons;
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
		const icon = (ico || 'heroicons:cube-transparent') as OutlinedIcons;
		const title = t[lang] || t[defaultLang];

		if (admin) {
			if (requiredPermissions === undefined) {
				continue;
			}
			if (requiredPermissions === 'none') {
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
				continue;
			}
			if (requiredPermissions === 'owner') {
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
			icon: 'heroicons:home',
			href: StudioCMSRoutes.mainLinks.dashboardIndex,
		},
		...filterAndProcessPages(userPages, false, ['none', 'visitor'], lang),
	];

	// Editor links
	const editorLinks: SidebarLink[] = [
		{
			key: 'content-management-label',
			icon: 'heroicons:pencil-square',
			href: StudioCMSRoutes.mainLinks.contentManagement,
		},
		{
			key: 'taxonomy-label',
			icon: 'heroicons:tag',
			href: StudioCMSRoutes.mainLinks.taxonomy,
		},
		...filterAndProcessPages(userPages, false, ['editor'], lang),
	];

	// Admin links
	const adminLinks: SidebarLink[] = [
		{
			key: 'user-management-label',
			icon: 'heroicons:user-group',
			href: StudioCMSRoutes.mainLinks.userManagement,
		},
		...filterAndProcessPages(adminPages, true, ['admin'], lang),
	];

	// Owner links
	const ownerLinks: SidebarLink[] = [
		{
			key: 'site-configuration-label',
			icon: 'heroicons:cog-6-tooth',
			href: StudioCMSRoutes.mainLinks.siteConfiguration,
		},
		{
			key: 'mailer-configuration-label',
			icon: 'heroicons:inbox',
			href: StudioCMSRoutes.mainLinks.smtpConfiguration,
		},
		{
			key: 'system-management-label',
			icon: 'heroicons:server-stack',
			href: StudioCMSRoutes.mainLinks.systemManagement,
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
