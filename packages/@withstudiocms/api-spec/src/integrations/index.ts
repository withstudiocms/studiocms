import { HttpApi, HttpApiGroup } from '@effect/platform';
import { Description, License, Title, Transform, Version } from '@effect/platform/OpenApi';
import pkg from '../../package.json';
import { IntegrationsAPIError } from './errors.js';
import { DbStudioQueryPost } from './routes/db-studio.js';
import { storageManagerPost, storageManagerPut } from './routes/storage.js';

export * from './errors.js';
export * from './schemas.js';

/**
 * Integrations API group for StudioCMS.
 *
 * @remarks
 * This class defines the Integrations API group, including metadata such as title,
 * description, version, and license information. It also specifies the error schema
 * used by the API.
 */
export class IntegrationsApi extends HttpApiGroup.make('integrations')
	.annotate(Title, 'Integrations API')
	.annotate(
		Description,
		"API endpoints and utilities for interacting with StudioCMS's internal integrations."
	)
	.annotate(Version, pkg.version)
	.annotate(License, {
		name: 'MIT',
		url: 'https://github.com/withstudiocms/studiocms/blob/main/packages/%40withstudiocms/api-spec/LICENSE',
	})

	// Db Studio Endpoints
	.add(DbStudioQueryPost)

	// Storage Manager Endpoints
	.add(storageManagerPost)
	.add(storageManagerPut)

	.addError(IntegrationsAPIError, { status: 500 })
	.prefix('/integrations') {}

/**
 * StudioCMS Integrations API Specification.
 *
 * @remarks
 * This class defines the overall API specification for the StudioCMS Integrations API,
 * including metadata such as title, description, version, license information, and
 * contact details. It also incorporates the Integrations API group.
 */
export class StudioCMSIntegrationsApiSpec extends HttpApi.make('StudioCMSIntegrationsApiSpec')
	.annotate(Title, 'StudioCMS Integrations API Specification')
	.annotate(
		Description,
		'API specification for the StudioCMS Integrations API, providing endpoints and utilities for integrations interactions.'
	)
	.annotate(License, {
		name: 'MIT',
		url: 'https://github.com/withstudiocms/studiocms/blob/main/packages/%40withstudiocms/api-spec/LICENSE',
	})
	.annotate(Version, pkg.version)
	.annotate(Transform, (data) => ({
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
	}))
	.add(IntegrationsApi)
	.prefix('/studiocms_api') {}
