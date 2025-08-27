import type { IconifyJSON } from '@studiocms/ui/types';

/**
 * Returns a new IconifyJSON object containing only the specified icons.
 *
 * @param src - The source IconifyJSON object containing all icons and metadata.
 * @param icons - An array of icon names to include in the resulting IconifyJSON.
 * @returns A new IconifyJSON object with only the specified icons and the original metadata.
 */
export function stripIconify(src: IconifyJSON, icons: string[]): IconifyJSON {
	const { icons: allIcons, ...srcData } = src;

	const filteredIcons = Object.entries(allIcons).filter(([name]) => icons.includes(name));

	return {
		...srcData,
		icons: Object.fromEntries(filteredIcons),
	};
}
