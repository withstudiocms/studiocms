/**
 * These triple-slash directives defines dependencies to various declaration files that will be
 * loaded when a user imports the StudioCMS plugin in their Astro configuration file. These
 * directives must be first at the top of the file and can only be preceded by this comment.
 */
/// <reference types="studiocms/v/types" />
/// <reference types="astro/client" />

import { createResolver } from 'astro-integration-kit';
import { definePlugin, type StudioCMSPlugin } from 'studiocms/plugins';

/**
 * Creates and returns the StudioCMS Discord Provider Plugin.
 *
 * This plugin integrates Discord as an OAuth authentication provider for StudioCMS.
 * It sets up the necessary configuration, including the required environment variables,
 * OAuth endpoint, and SVG logo for Discord.
 *
 * @returns {StudioCMSPlugin} The configured StudioCMS Discord Provider Plugin.
 *
 * @remarks
 * - Requires the following environment variables to be set:
 *   - `CMS_DISCORD_CLIENT_ID`
 *   - `CMS_DISCORD_CLIENT_SECRET`
 *   - `CMS_DISCORD_REDIRECT_URI`
 */
export function studiocmsDiscord(): StudioCMSPlugin {
	// Resolve the path to the current file
	const { resolve } = createResolver(import.meta.url);

	// Define the package identifier
	const packageIdentifier = '@studiocms/discord';

	// Return the plugin configuration
	return definePlugin({
		identifier: packageIdentifier,
		name: 'StudioCMS Discord Provider Plugin',
		studiocmsMinimumVersion: '0.1.0-beta.22',
		hooks: {
			'studiocms:config:setup': ({ setAuthService }) => {
				setAuthService({
					oAuthProvider: {
						name: 'discord',
						formattedName: 'Discord',
						endpointPath: resolve('./endpoint.js'),
						requiredEnvVariables: [
							'CMS_DISCORD_CLIENT_ID',
							'CMS_DISCORD_CLIENT_SECRET',
							'CMS_DISCORD_REDIRECT_URI',
						],
						svg: '<svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 256 199" class="oauth-logo"><path fill="currentColor" d="M216.856 16.597A208.5 208.5 0 0 0 164.042 0c-2.275 4.113-4.933 9.645-6.766 14.046q-29.538-4.442-58.533 0c-1.832-4.4-4.55-9.933-6.846-14.046a207.8 207.8 0 0 0-52.855 16.638C5.618 67.147-3.443 116.4 1.087 164.956c22.169 16.555 43.653 26.612 64.775 33.193A161 161 0 0 0 79.735 175.3a136.4 136.4 0 0 1-21.846-10.632a109 109 0 0 0 5.356-4.237c42.122 19.702 87.89 19.702 129.51 0a132 132 0 0 0 5.355 4.237a136 136 0 0 1-21.886 10.653c4.006 8.02 8.638 15.67 13.873 22.848c21.142-6.58 42.646-16.637 64.815-33.213c5.316-56.288-9.08-105.09-38.056-148.36M85.474 135.095c-12.645 0-23.015-11.805-23.015-26.18s10.149-26.2 23.015-26.2s23.236 11.804 23.015 26.2c.02 14.375-10.148 26.18-23.015 26.18m85.051 0c-12.645 0-23.014-11.805-23.014-26.18s10.148-26.2 23.014-26.2c12.867 0 23.236 11.804 23.015 26.2c0 14.375-10.148 26.18-23.015 26.18"/></svg>',
					},
				});
			},
		},
	});
}

export default studiocmsDiscord;
