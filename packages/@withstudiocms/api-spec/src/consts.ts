/**
 * This module defines constants for the StudioCMS API specifications, including version annotations and license information.
 */

import pkg from '../package.json';

/**
 * Rest API version annotation for StudioCMS REST API v1.0.0.
 */
export const restApiV1VersionAnnotation = `studiocms@${pkg.version}/rest-api/v1.0.0`;

/**
 * MIT License information for StudioCMS APIs.
 */
export const StudioCMSLicenseAnnotation = {
	name: 'MIT',
	url: 'https://github.com/withstudiocms/studiocms/blob/main/packages/%40withstudiocms/api-spec/LICENSE',
};

/**
 * Custom OpenAPI Transform annotation for StudioCMS APIs to include additional metadata such as contact information and external documentation links.
 *
 * @param data - The original OpenAPI specification data to be transformed.
 * @returns The transformed OpenAPI specification data with added contact and external documentation information.
 */
// biome-ignore lint/suspicious/noExplicitAny: This function is a generic transformer for StudioCMS annotations and can accept any shape of data.
export const StudioCMSTransformAnnotation = (data: any) => ({
	...data,
	info: {
		...data.info,
		contact: {
			name: 'StudioCMS Team',
			url: 'https://chat.studiocms.dev',
			email: 'support@studiocms.dev',
		},
	},
	externalDocs: {
		url: 'https://docs.studiocms.dev/en/',
		description: 'StudioCMS Documentation',
	},
});
