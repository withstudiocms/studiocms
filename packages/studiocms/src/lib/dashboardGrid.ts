import type { HeroIconName } from '@studiocms/ui/components/Icon/iconType.js';
import type { SanitizeOptions } from 'ultrahtml/transformers/sanitize';

/**
 * Represents the input for a grid item in the dashboard.
 */
export interface GridItemInput {
	/**
	 * The name of the grid item.
	 */
	name: string;

	/**
	 * The span of the grid item, which can be 1, 2, or 3.
	 */
	span: 1 | 2 | 3;

	/**
	 * The variant of the grid item, which can be 'default' or 'filled'.
	 */
	variant: 'default' | 'filled';

	/**
	 * The required permission level to view the grid item.
	 * Optional. Can be 'owner', 'admin', 'editor', or 'visitor'.
	 */
	requiresPermission?: 'owner' | 'admin' | 'editor' | 'visitor';

	/**
	 * The header of the grid item.
	 * Optional.
	 */
	header?: {
		/**
		 * The title of the header.
		 */
		title: string;

		/**
		 * The icon of the header.
		 * Optional.
		 */
		icon?: HeroIconName;
	};

	/**
	 * The body of the grid item.
	 * Optional.
	 */
	body?: {
		/**
		 * The HTML content of the body.
		 */
		html: string;

		/**
		 * The components within the body.
		 * Optional.
		 */
		components?: Record<string, string>;

		/**
		 * The options for sanitizing the HTML content.
		 * Optional.
		 */
		sanitizeOpts?: SanitizeOptions;
	};
}

/**
 * Represents an item that can be used in a dashboard grid.
 */
export interface GridItemUsable {
	/**
	 * The name of the grid item.
	 */
	name: string;

	/**
	 * The span of the grid item, which can be 1, 2, or 3.
	 */
	span: 1 | 2 | 3;

	/**
	 * The variant of the grid item, which can be 'default' or 'filled'.
	 */
	variant: 'default' | 'filled';

	/**
	 * Optional. The permission required to use the grid item.
	 * Can be 'owner', 'admin', 'editor', or 'visitor'.
	 */
	requiresPermission?: 'owner' | 'admin' | 'editor' | 'visitor';

	/**
	 * Optional. The header of the grid item.
	 */
	header?: {
		/**
		 * The title of the header.
		 */
		title: string;

		/**
		 * Optional. The icon of the header.
		 */
		icon?: HeroIconName;
	};

	/**
	 * Optional. The body of the grid item.
	 */
	body?: {
		/**
		 * The HTML content of the body.
		 */
		html: string;

		/**
		 * Optional. The components of the body.
		 *
		 */
		// biome-ignore lint/suspicious/noExplicitAny: This is a valid use case for explicit any.
		components?: Record<string, any>;

		/**
		 * Optional. The options for sanitizing the HTML content.
		 */
		sanitizeOpts?: SanitizeOptions;
	};
}

/**
 * Represents an item in the dashboard grid.
 * Extends the properties of `GridItemUsable` and adds an `enabled` flag.
 */
export interface GridItem extends GridItemUsable {
	enabled: boolean;
}
