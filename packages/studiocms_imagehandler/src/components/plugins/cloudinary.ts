import { CMS_CLOUDINARY_CLOUDNAME } from 'astro:env/server';
import { Cloudinary } from '@cloudinary/url-gen';
import { fill } from '@cloudinary/url-gen/actions/resize';
import type { SharedProps } from '../props';

/**
 * Cloudinary Plugin
 *
 * This plugin is used to generate Cloudinary URLs for images using `@cloudinary/url-gen` for the StudioCMS `CustomImage` component.
 *
 * @param src the image name or URL
 * @param props the image props
 * @returns the Cloudinary image URL for the given source and props
 */
export function cloudinaryPlugin(src: string, props: Omit<SharedProps, 'src'>) {
	// Cloudinary Image Service (JavaScript SDK) - https://cloudinary.com/documentation/javascript_integration#landingpage

	// Initialize Cloudinary
	const cld = new Cloudinary({
		cloud: {
			cloudName: CMS_CLOUDINARY_CLOUDNAME || '',
		},
	});

	// Configure the image
	const cldSrc = cld
		.image(src)
		.format('auto')
		.quality('auto')
		.resize(fill('auto').width(props.width).height(props.height));

	// Set the delivery type to 'fetch' if the image source is an external URL
	if (src.startsWith('https://') || src.startsWith('http://')) {
		cldSrc.setDeliveryType('fetch');
	}

	// Return the Cloudinary image URL
	return cldSrc.toURL();
}
