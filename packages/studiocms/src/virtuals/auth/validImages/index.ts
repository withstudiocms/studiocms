/// <reference types="astro/client" />
import type { ImageMetadata } from 'astro';
import studiocmsBlobsDark from './studiocms-blobs-dark.webp';
import studiocmsBlobsLight from './studiocms-blobs-light.webp';
import studiocmsBlocksDark from './studiocms-blocks-dark.webp';
import studiocmsBlocksLight from './studiocms-blocks-light.webp';
import studiocmsCurvesDark from './studiocms-curves-dark.webp';
import studiocmsCurvesLight from './studiocms-curves-light.webp';

interface ValidImageBase {
	readonly name: string;
	readonly label: string;
}

export interface ValidWebImage extends ValidImageBase {
	readonly format: 'web';
}

export interface ValidLocalImage extends ValidImageBase {
	readonly format: 'local';
	readonly light: ImageMetadata;
	readonly dark: ImageMetadata;
}

export type ValidImage = ValidWebImage | ValidLocalImage;

/**
 * The valid images that can be used as a background for the StudioCMS Logo.
 */
const validImages: ValidImage[] = [
	{
		name: 'studiocms-blobs',
		label: 'Blobs',
		format: 'local',
		light: studiocmsBlobsLight,
		dark: studiocmsBlobsDark,
	},
	{
		name: 'studiocms-blocks',
		label: 'Blocks',
		format: 'local',
		light: studiocmsBlocksLight,
		dark: studiocmsBlocksDark,
	},
	{
		name: 'studiocms-curves',
		label: 'Curves',
		format: 'local',
		light: studiocmsCurvesLight,
		dark: studiocmsCurvesDark,
	},
	{
		name: 'custom',
		label: 'Custom',
		format: 'web',
	},
] as const;

export { validImages };
