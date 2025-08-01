/**
 * These triple-slash directives defines dependencies to various declaration files that will be
 * loaded when a user imports the StudioCMS plugin in their Astro configuration file. These
 * directives must be first at the top of the file and can only be preceded by this comment.
 */
/// <reference types="astro/client" />
/// <reference types="studiocms/v/types" />

import { createResolver } from 'astro-integration-kit';
import { definePlugin, type StudioCMSPlugin } from 'studiocms/plugins';

/**
 * Registers the StudioCMS Auth0 plugin.
 *
 * This plugin integrates Auth0 as an OAuth provider for StudioCMS, enabling authentication via Auth0.
 * It sets up the necessary configuration, including required environment variables and endpoint path.
 *
 * @returns {StudioCMSPlugin} The configured StudioCMS Auth0 plugin.
 *
 * @remarks
 * - The following environment variables must be set:
 *   - `CMS_AUTH0_CLIENT_ID`
 *   - `CMS_AUTH0_CLIENT_SECRET`
 *   - `CMS_AUTH0_DOMAIN`
 *   - `CMS_AUTH0_REDIRECT_URI`
 *
 * @example
 * ```typescript
 * import { studiocmsAuth0 } from '@studiocms/auth0';
 * const plugin = studiocmsAuth0();
 * ```
 */
export function studiocmsAuth0(): StudioCMSPlugin {
	// Resolve the path to the current file
	const { resolve } = createResolver(import.meta.url);

	// Define the package identifier
	const packageIdentifier = '@studiocms/auth0';

	// Return the plugin configuration
	return definePlugin({
		identifier: packageIdentifier,
		name: 'StudioCMS Auth0 Provider Plugin',
		studiocmsMinimumVersion: '0.1.0-beta.22',
		hooks: {
			'studiocms:config:setup': ({ setAuthService }) => {
				setAuthService({
					oAuthProvider: {
						name: 'auth0',
						formattedName: 'Auth0',
						endpointPath: resolve('./endpoint.js'),
						requiredEnvVariables: [
							'CMS_AUTH0_CLIENT_ID',
							'CMS_AUTH0_CLIENT_SECRET',
							'CMS_AUTH0_DOMAIN',
							'CMS_AUTH0_REDIRECT_URI',
						],
						svg: '<svg xmlns="http://www.w3.org/2000/svg"  width="24px" height="24px" viewBox="0 0 32 32" class="oauth-logo"><path fill="currentColor" d="M29.307 9.932L26.161 0H5.796L2.692 9.932c-1.802 5.75.042 12.271 5.089 16.021L16.01 32l8.208-6.068c5.005-3.75 6.911-10.25 5.089-16.021l-8.214 6.104l3.12 9.938l-8.208-6.13l-8.208 6.104l3.141-9.911l-8.25-6.063l10.177-.063l3.146-9.891l3.141 9.87z"/></svg>',
					},
				});
			},
		},
	});
}

export default studiocmsAuth0;
