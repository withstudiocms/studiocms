import { Schema } from 'effect';
import { createRestRouter, type RouteRegistry } from '../../utils/rest-router.js';
import { pagesRouter } from './_routes/pages.js';

const registry: RouteRegistry = {
	// categories: categoriesRouter,
	// tags: tagsRouter,
	// folders: foldersRouter,
	pages: pagesRouter,
	// settings: settingsRouter,
	// users: usersRouter,
};

export const ALL = createRestRouter(
	'studiocms:rest:v1',
	Schema.Literal('categories', 'tags', 'folders', 'pages', 'settings', 'users'),
	registry
);
