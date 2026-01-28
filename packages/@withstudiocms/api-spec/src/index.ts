import { HttpApi } from '@effect/platform';
import {
	Description,
	ExternalDocs,
	License,
	Title,
	Transform,
	Version,
} from '@effect/platform/OpenApi';
import pkg from '../package.json';
import { RestApiV1PublicSpec, RestApiV1SecureSpec } from './rest-api/v1/index.js';

export * from './rest-api/index.js';

export class StudioCMSAPISpec extends HttpApi.make('StudioCMSAPISpec')
	.annotate(Title, 'StudioCMS API Specifications')
	.annotate(
		Description,
		'This documentation covers the full StudioCMS API available from any StudioCMS installation.\n\n## External Resources\n\n- [Main Website](https://studiocms.dev)\n- [StudioCMS GitHub Repository](https://github.com/withstudiocms/studiocms)\n- [Discord Community](https://chat.studiocms.dev)\n- [API Source definitions](https://github.com/withstudiocms/studiocms/blob/main/packages/%40withstudiocms/api-spec/)\n\n> [!warning]\n> **This document is not yet complete, additional endpoints and details will be added over time.**\n\n---\n\n_This API specification is automatically generated and maintained by the StudioCMS team._'
	)
	.annotate(License, {
		name: 'MIT',
		url: 'https://github.com/withstudiocms/studiocms/blob/main/packages/%40withstudiocms/api-spec/LICENSE',
	})
	.annotate(ExternalDocs, {
		url: 'https://docs.studiocms.dev/en/',
		description: 'StudioCMS Documentation',
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

	// Rest API v1
	.add(RestApiV1PublicSpec)
	.add(RestApiV1SecureSpec)

	// Prefix all paths with /studiocms_api
	.prefix('/studiocms_api') {}
