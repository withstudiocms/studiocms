import type { IconifyJSON } from '@studiocms/ui/types';

/**
 * Strips an Iconify JSON object to only include specified icons.
 *
 * @param params - An object containing the source Iconify JSON and an array of icon names to retain.
 * @param params.src - The original Iconify JSON object.
 * @param params.icons - An array of icon names to retain in the stripped Iconify JSON.
 * @returns A new Iconify JSON object containing only the specified icons.
 */
export function stripIconify({ src, icons }: { src: IconifyJSON; icons: string[] }): IconifyJSON {
	const { icons: allIcons, ...srcData } = src;

	const filteredIcons = Object.entries(allIcons).filter(([name]) => icons.includes(name));

	return {
		...srcData,
		icons: Object.fromEntries(filteredIcons),
	};
}
