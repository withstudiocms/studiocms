import { integrationLogger } from '@matthiesenxyz/integration-utils/astroUtils';
import { addAstroEnvConfig } from '@studiocms/core/utils';
import type { InjectedType } from 'astro';
import { defineIntegration } from 'astro-integration-kit';
import { envField } from 'astro/config';
import { loadEnv } from 'vite';
import { name } from '../package.json';
import { componentResolver } from './componentResolver';
import { StudioCMSImageHandlerOptionsSchema } from './schema';

export default defineIntegration({
	name,
	optionsSchema: StudioCMSImageHandlerOptionsSchema,
	setup({
		name,
		options: {
			verbose,
			imageService: { cdnPlugin },
			overrides: { CustomImageOverride },
		},
	}) {
		// Load Environment Variables
		const env = loadEnv('all', process.cwd(), 'CMS');

		// Define the DTS File
		let dtsFile: InjectedType;

		return {
			hooks: {
				'astro:config:setup': (params) => {
					// Destructure Params
					const { logger, updateConfig } = params;

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
					const { imageHandlerDtsFile } = componentResolver(params, {
						name,
						CustomImageOverride,
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

					// Return the Custom Image DTS File
					dtsFile = imageHandlerDtsFile;
				},
				'astro:config:done': ({ injectTypes }) => {
					injectTypes(dtsFile);
				},
			},
		};
	},
});
