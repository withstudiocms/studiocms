import type { HeroIconName } from '@studiocms/ui/components/Icon/iconType.js';
import type { SanitizeOptions } from 'ultrahtml/transformers/sanitize';

export interface GridItem {
	span: 1 | 2 | 3;
	variant: 'default' | 'filled';
	header?: {
		title: string;
		icon?: HeroIconName;
	};
	body?: {
		html: string;
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		components?: Record<string, any>;
		sanitizeOpts?: SanitizeOptions;
	};
}
