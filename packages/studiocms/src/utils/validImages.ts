// @ts-nocheck
import type { ImageMetadata } from 'astro';
import studiocmsBlobsDark from '../resources/loginBackgrounds/studiocms-blobs-dark.png';
import studiocmsBlobsLight from '../resources/loginBackgrounds/studiocms-blobs-light.png';
import studiocmsBlocksDark from '../resources/loginBackgrounds/studiocms-blocks-dark.png';
import studiocmsBlocksLight from '../resources/loginBackgrounds/studiocms-blocks-light.png';
import studiocmsCurvesDark from '../resources/loginBackgrounds/studiocms-curves-dark.png';
import studiocmsCurvesLight from '../resources/loginBackgrounds/studiocms-curves-light.png';

interface ValidImage {
	readonly name: string;
	readonly label: string;
	readonly format: 'png' | 'web';
	readonly light: ImageMetadata | null;
	readonly dark: ImageMetadata | null;
}

/**
 * The valid images that can be used as a background for the StudioCMS Logo.
 */
const validImages: ValidImage[] = [
	{
		name: 'studiocms-blobs',
		label: 'Blobs',
		format: 'png',
		light: studiocmsBlobsLight,
		dark: studiocmsBlobsDark,
	},
	{
		name: 'studiocms-blocks',
		label: 'Blocks',
		format: 'png',
		light: studiocmsBlocksLight,
		dark: studiocmsBlocksDark,
	},
	{
		name: 'studiocms-curves',
		label: 'Curves',
		format: 'png',
		light: studiocmsCurvesLight,
		dark: studiocmsCurvesDark,
	},
	{
		name: 'custom',
		label: 'Custom',
		format: 'web',
		light: null,
		dark: null,
	},
] as const;

export { validImages };
