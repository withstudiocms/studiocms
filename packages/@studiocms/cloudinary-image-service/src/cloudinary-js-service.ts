/// <reference path="../astroenv.d.ts" />

import { getSecret } from 'astro:env/server';
import { Cloudinary } from '@cloudinary/url-gen';
import { fill } from '@cloudinary/url-gen/actions/resize';
import { AstroError } from 'astro/errors';
import type { StudioCMSImageService } from 'studiocms/schemas';

/**
 * Cloudinary Image Service
 *
 * This plugin is used to generate Cloudinary URLs for images using `@cloudinary/url-gen` for the StudioCMS `CustomImage` component.
 *
 * @param src the image name or URL
 * @param props the image props
 * @returns the Cloudinary image URL for the given source and props
 */
const cloudinaryImageService: StudioCMSImageService = (src, props) => {
	// Cloudinary Image Service (JavaScript SDK) - https://cloudinary.com/documentation/javascript_integration#landingpage

	try {
		const CMS_CLOUDINARY_CLOUDNAME = getSecret('CMS_CLOUDINARY_CLOUDNAME');

		if (!CMS_CLOUDINARY_CLOUDNAME) {
			throw new AstroError(
				'CMS_CLOUDINARY_CLOUDNAME environment variable is required for Cloudinary image service'
			);
		}

		// Initialize Cloudinary
		const cld = new Cloudinary({
			cloud: {
				cloudName: CMS_CLOUDINARY_CLOUDNAME,
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
	} catch (error) {
		console.error('Error generating Cloudinary URL:', error);
		return src;
	}
};

export default cloudinaryImageService;
