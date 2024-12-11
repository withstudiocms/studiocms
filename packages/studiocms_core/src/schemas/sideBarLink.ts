import type { HeroIconName } from '@studiocms/ui/utils/iconType.ts';
import { z } from 'astro/zod';

export const SideBarLinkSchema = z.object({
	id: z.string(),
	href: z.string(),
	text: z.string(),
	minPermissionLevel: z.string(),
	icon: z.custom<HeroIconName>(),
});

export type SideBarLink = z.infer<typeof SideBarLinkSchema>;
