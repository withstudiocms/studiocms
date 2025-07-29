import type { AstroIntegration } from 'astro';
import { envField } from 'astro/config';
import { createResolver } from 'astro-integration-kit';
import { definePlugin } from 'studiocms/plugins';
import { readJson } from './utils/readJson.js';

const { resolve } = createResolver(import.meta.url);

// Read the package.json file for the package name and version
const { name } = readJson<{ name: string; version: string }>(resolve('../package.json'));

const identifier = 'cloudinary-js';
const servicePath = resolve('./cloudinary-js-service.js');

const CloudinaryENVIntegration = (): AstroIntegration => ({
	name: `${name}/astro-integration`,
	hooks: {
		'astro:config:setup': ({ logger, updateConfig }) => {
			logger.info('Configuring Astro ENV');

			updateConfig({
				env: {
					schema: {
						// Cloudinary Environment Variables for Custom Image Component
						CMS_CLOUDINARY_CLOUDNAME: envField.string({
							context: 'server',
							access: 'secret',
							optional: false,
						}),
					},
				},
			});
		},
	},
});

/**
 * Cloudinary Image Service
 *
 * This plugin is used to generate Cloudinary URLs for images using `@cloudinary/url-gen` for StudioCMS.
 */
function cloudinaryImageService() {
	return definePlugin({
		name: `Cloudinary JS Image Service (${identifier})`,
		identifier: name,
		studiocmsMinimumVersion: '0.1.0-beta.19',
		hooks: {
			'studiocms:astro:config': ({ addIntegrations }) => {
				addIntegrations(CloudinaryENVIntegration());
			},
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
