import { Schema } from 'effect';
import { createRestRouter, type RouteRegistry } from '#frontend/utils/rest-router.js';
import { dbStudioRoute } from './_routes/db-studio.js';
import { storageRoute } from './_routes/storage.js';

const registry: RouteRegistry = {
	'db-studio': dbStudioRoute,
	storage: storageRoute,
};

export const ALL = createRestRouter(
	'studiocms:integrations',
	Schema.Literal('db-studio', 'storage'),
	registry
);
