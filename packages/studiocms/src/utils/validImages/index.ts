/// <reference types="astro/client" />
import type { ImageMetadata } from 'astro';
import studiocmsBlobsDark from './studiocms-blobs-dark.webp';
import studiocmsBlobsLight from './studiocms-blobs-light.webp';
import studiocmsBlocksDark from './studiocms-blocks-dark.webp';
import studiocmsBlocksLight from './studiocms-blocks-light.webp';
import studiocmsCurvesDark from './studiocms-curves-dark.webp';
import studiocmsCurvesLight from './studiocms-curves-light.webp';

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
