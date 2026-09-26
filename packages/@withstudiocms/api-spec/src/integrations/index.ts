import { HttpApi, HttpApiGroup } from '@effect/platform';
import { Description, License, Title, Transform, Version } from '@effect/platform/OpenApi';
import pkg from '../../package.json';
import { StudioCMSLicenseAnnotation, StudioCMSTransformAnnotation } from '../consts.js';
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
export class DBStudioApi extends HttpApiGroup.make('dbStudio')
	.annotate(Title, 'DB Studio API')
	.annotate(
		Description,
		"API endpoints and utilities for interacting with StudioCMS's internal DB Studio integrations."
	)
	.annotate(Version, pkg.version)
	.annotate(License, StudioCMSLicenseAnnotation)

	// Db Studio Endpoints
	.add(DbStudioQueryPost)

	.addError(IntegrationsAPIError, { status: 500 })
	.prefix('/integrations') {}

/**
 * Integrations API group for StudioCMS.
 *
 * @remarks
 * This class defines the Integrations API group, including metadata such as title,
 * description, version, and license information. It also specifies the error schema
 * used by the API.
 */
export class StorageManagerApi extends HttpApiGroup.make('storageManager')
	.annotate(Title, 'Storage Manager API')
	.annotate(
		Description,
		"API endpoints and utilities for interacting with StudioCMS's internal storage manager integrations."
	)
	.annotate(Version, pkg.version)
	.annotate(License, StudioCMSLicenseAnnotation)

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
		'API specification for the StudioCMS Integrations API, providing endpoints and utilities for integrations interactions.\n\n## External Resources\n\n- [Main Website](https://studiocms.dev)\n- [StudioCMS GitHub Repository](https://github.com/withstudiocms/studiocms)\n- [Discord Community](https://chat.studiocms.dev)\n- [API Source definitions](https://github.com/withstudiocms/studiocms/blob/main/packages/%40withstudiocms/api-spec/)\n\n---\n\n_This API specification is automatically generated and maintained by the StudioCMS team._'
	)
	.annotate(License, StudioCMSLicenseAnnotation)
	.annotate(Version, pkg.version)
	.annotate(Transform, StudioCMSTransformAnnotation)
	.add(DBStudioApi)
	.add(StorageManagerApi)
	.prefix('/studiocms_api') {}
