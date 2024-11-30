import type { HeroIconName } from '@studiocms/ui/utils/iconType.ts';

// Sidebar link type
/**
 * @param id - The unique identifier for the link
 * @param href - The URL to redirect to
 * @param text - The text to display for the link
 * @param minPermissionLevel - The minimum permission level required to view the link (unknown, visitor, editor, admin)
 * @param icon - The icon to display for the link. See https://heroicons.com/ for the available names.
 */
export type SideBarLink = {
	/** Unique link ID */
	id: string;
	/** URL to redirect to */
	href: string;
	/** Text to display for the link */
	text: string;
	/** Minimum permission level required to view the link (unknown/visitor/editor/admin) */
	minPermissionLevel: string;
	/** Icon to display for the link ( icon: 'user') */
	icon: HeroIconName;
	/** Type of link (link/dropdown) */
	type: 'link' | 'dropdown';
	/** Dropdown items for dropdown links (Requires `type: 'dropdown'`) */
	dropdownItems?: SideBarLink[];
};
