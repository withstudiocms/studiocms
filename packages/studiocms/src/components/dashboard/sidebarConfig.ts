import { type UiLanguageKeys, useTranslations } from 'studiocms:i18n';
import { StudioCMSRoutes } from 'studiocms:lib';
import type { HeroIconName } from '@studiocms/ui/components/Icon/iconType.js';

interface SidebarLink {
	title: string;
	icon: HeroIconName;
	href: string;
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
	];

	// Editor links
	const editorLinks: SidebarLink[] = [
		{
			title: t('content-management-label'),
			icon: 'pencil-square',
			href: StudioCMSRoutes.mainLinks.contentManagement,
		},
	];

	// Admin links
	const adminLinks: SidebarLink[] = [
		{
			title: t('user-management-label'),
			icon: 'user-group',
			href: StudioCMSRoutes.mainLinks.userManagement,
		},
	];

	// Owner links
	const ownerLinks: SidebarLink[] = [
		{
			title: t('site-configuration-label'),
			icon: 'cog-6-tooth',
			href: StudioCMSRoutes.mainLinks.siteConfiguration,
		},
	];

	return {
		baseLinks,
		editorLinks,
		adminLinks,
		ownerLinks,
	};
}
