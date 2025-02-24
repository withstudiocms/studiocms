import { type UiLanguageKeys, useTranslations } from 'studiocms:i18n';
import { StudioCMSRoutes, makeDashboardRoute } from 'studiocms:lib';
import { getPluginDashboardPages } from 'studiocms:plugin-helpers';
import type { HeroIconName } from '@studiocms/ui/components/Icon/iconType.js';

interface SidebarLink {
	title: string;
	icon: HeroIconName;
	href: string;
}

const { adminPages, userPages } = getPluginDashboardPages();

const pluginBaseLinks: SidebarLink[] = [];
const pluginEditorLinks: SidebarLink[] = [];
const pluginAdminLinks: SidebarLink[] = [];
const pluginOwnerLinks: SidebarLink[] = [];

for (const { title, icon: i, slug, requiredPermissions } of adminPages) {
	const href = makeDashboardRoute(slug);
	const icon = i || 'cube-transparent';
	switch (requiredPermissions) {
		case 'owner':
			pluginOwnerLinks.push({ title, icon, href });
			break;
		case 'admin':
			pluginAdminLinks.push({ title, icon, href });
			break;
		case 'editor':
			console.warn(
				`Plugin page ${title} is an editor page and should be part of the userPages and not the adminPages`
			);
			pluginEditorLinks.push({ title, icon, href });
			break;
		default:
			console.warn(
				`Plugin page ${title} is a unrestricted page and should be part of the userPages and not the adminPages`
			);
			pluginBaseLinks.push({ title, icon, href });
			break;
	}
}

for (const { title, icon: i, slug, requiredPermissions } of userPages) {
	const href = makeDashboardRoute(slug);
	const icon = i || 'cube-transparent';
	switch (requiredPermissions) {
		case 'owner':
			console.warn(
				`Plugin page ${title} is an owner page and should be part of the adminPages and not the userPages`
			);
			pluginOwnerLinks.push({ title, icon, href });
			break;
		case 'admin':
			console.warn(
				`Plugin page ${title} is an admin page and should be part of the adminPages and not the userPages`
			);
			pluginAdminLinks.push({ title, icon, href });
			break;
		case 'editor':
			pluginEditorLinks.push({ title, icon, href });
			break;
		default:
			pluginBaseLinks.push({ title, icon, href });
			break;
	}
}

export function getSidebarLinks(lang: UiLanguageKeys) {
	const t = useTranslations(lang, '@studiocms/dashboard:sidebar');

	// Base links
	const baseLinks: SidebarLink[] = [
		{
			title: t('dashboard-link-label'),
			icon: 'home',
			href: StudioCMSRoutes.mainLinks.dashboardIndex,
		},
		...pluginBaseLinks,
	];

	// Editor links
	const editorLinks: SidebarLink[] = [
		{
			title: t('content-management-label'),
			icon: 'pencil-square',
			href: StudioCMSRoutes.mainLinks.contentManagement,
		},
		...pluginEditorLinks,
	];

	// Admin links
	const adminLinks: SidebarLink[] = [
		{
			title: t('user-management-label'),
			icon: 'user-group',
			href: StudioCMSRoutes.mainLinks.userManagement,
		},
		...pluginAdminLinks,
	];

	// Owner links
	const ownerLinks: SidebarLink[] = [
		{
			title: t('site-configuration-label'),
			icon: 'cog-6-tooth',
			href: StudioCMSRoutes.mainLinks.siteConfiguration,
		},
		...pluginOwnerLinks,
	];

	return {
		baseLinks,
		editorLinks,
		adminLinks,
		ownerLinks,
	};
}
