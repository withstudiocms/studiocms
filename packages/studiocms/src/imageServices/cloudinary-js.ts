import { createResolver } from 'astro-integration-kit';
import { definePlugin } from '../schemas/index.js';
import { readJson } from '../utils/readJson.js';

const { resolve } = createResolver(import.meta.url);

// Read the package.json file for the package name and version
const { version: studiocmsMinimumVersion } = readJson<{ name: string; version: string }>(
	resolve('../../package.json')
);

const identifier = 'cloudinary-js';
const servicePath = resolve('./cloudinary-js-service.js');

/**
 * Cloudinary Image Service
 *
 * This plugin is used to generate Cloudinary URLs for images using `@cloudinary/url-gen` for StudioCMS.
 */
function cloudinaryImageService() {
	return definePlugin({
		name: `Cloudinary JS Image Service (${identifier})`,
		identifier,
		studiocmsMinimumVersion,
		hooks: {
			'studiocms:config:setup': ({ logger, setImageService }) => {
				logger.info('Initializing Cloudinary Image Service');

				setImageService({
					imageService: {
						identifier,
						servicePath,
					},
				});
			},
		},
	});
}

export default cloudinaryImageService;
