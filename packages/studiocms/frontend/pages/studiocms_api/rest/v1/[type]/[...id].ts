import { Schema } from 'effect';
import { createRestRouter, type RouteRegistry } from '../../../../../utils/rest-router.js';
import { categoriesRouter } from './_routes/categories.js';
import { foldersRouter } from './_routes/folders.js';
import { pagesRouter } from './_routes/pages.js';
import { settingsRouter } from './_routes/settings.js';
import { tagsRouter } from './_routes/tags.js';
import { usersRouter } from './_routes/users.js';

const registry: RouteRegistry = {
	categories: categoriesRouter,
	folders: foldersRouter,
	pages: pagesRouter,
	settings: settingsRouter,
	tags: tagsRouter,
	users: usersRouter,
};

export const ALL = createRestRouter(
	'studiocms:rest:v1',
	Schema.Literal('categories', 'folders', 'pages', 'settings', 'tags', 'users'),
	registry
);
