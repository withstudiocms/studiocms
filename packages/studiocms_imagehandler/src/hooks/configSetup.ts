import { integrationLogger } from '@matthiesenxyz/integration-utils/astroUtils';
import { addAstroEnvConfig } from '@studiocms/core/utils';
import { addVirtualImports, createResolver, defineUtility } from 'astro-integration-kit';
import { envField } from 'astro/config';
import { loadEnv } from 'vite';
import type { StudioCMSImageHandlerOptions } from '../schema';

export const configSetup = defineUtility('astro:config:setup')(
	(params, name: string, options: StudioCMSImageHandlerOptions) => {
		// Load Environment Variables
		const env = loadEnv('all', process.cwd(), 'CMS');

		// Destructure the params object
		const { logger, updateConfig } = params;

		// Destructure the options object
		const {
			verbose,
			imageService: { cdnPlugin },
		} = options;

		// Add Astro Environment Configuration
		addAstroEnvConfig(params, {
			validateSecrets: false,
			schema: {
				CMS_CLOUDINARY_CLOUDNAME: envField.string({
					context: 'server',
					access: 'secret',
					optional: true,
				}),
			},
		});

		// Check for Cloudinary CDN Plugin
		if (cdnPlugin === 'cloudinary-js') {
			if (!env.CMS_CLOUDINARY_CLOUDNAME) {
				integrationLogger(
					{ logger, logLevel: 'warn', verbose: true },
					'Using the Cloudinary CDN JS SDK Plugin requires the CMS_CLOUDINARY_CLOUDNAME environment variable to be set. Please add this to your .env file.'
				);
			}
		}

		// Setup and Configure CustomImage Component
		integrationLogger(
			{ logger, logLevel: 'info', verbose },
			'Configuring CustomImage Component...'
		);

		// Create resolver relative to this file
		const { resolve } = createResolver(import.meta.url);

		// Create resolver relative to Astro config root
		const { resolve: astroConfigResolve } = createResolver(params.config.root.pathname);

		const imageComponentPath = options.overrides.CustomImageOverride
			? astroConfigResolve(options.overrides.CustomImageOverride)
			: resolve('../components/CustomImage.astro');

		addVirtualImports(params, {
			name: name,
			imports: {
				'studiocms:imageHandler/components': `export { default as CustomImage } from '${imageComponentPath}';`,
			},
		});

		// Update the Astro Config with the Image Service Configuration to allow for remote images
		integrationLogger(
			{ logger, logLevel: 'info', verbose },
			'Updating Astro Config with Image Service Configuration to allow for remote images...'
		);
		updateConfig({
			image: {
				remotePatterns: [
					{
						protocol: 'https',
					},
				],
			},
		});

		// Return the imageComponentPath to be used in another hook
		return imageComponentPath;
	}
);

export default configSetup;
