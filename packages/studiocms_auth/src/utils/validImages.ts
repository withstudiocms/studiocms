import studiocmsBlobsDark from '../loginBackgrounds/studiocms-blobs-dark.png';
import studiocmsBlobsLight from '../loginBackgrounds/studiocms-blobs-light.png';
import studiocmsBlocksDark from '../loginBackgrounds/studiocms-blocks-dark.png';
import studiocmsBlocksLight from '../loginBackgrounds/studiocms-blocks-light.png';
import studiocmsCurvesDark from '../loginBackgrounds/studiocms-curves-dark.png';
import studiocmsCurvesLight from '../loginBackgrounds/studiocms-curves-light.png';

/**
 * The valid images that can be used as a background for the StudioCMS Logo.
 */
const validImages = [
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
