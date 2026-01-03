import { Schema } from 'effect';
import { createRestRouter, type RouteRegistry } from '../../../utils/rest-router.js';
import { categoriesRouter } from './_routes/categories.js';
import { foldersRouter } from './_routes/folders.js';
import { pagesRouter } from './_routes/pages.js';
import { tagsRouter } from './_routes/tags.js';

const registry: RouteRegistry = {
	categories: categoriesRouter,
	tags: tagsRouter,
	folders: foldersRouter,
	pages: pagesRouter,
};

export const ALL = createRestRouter(
	'studiocms:rest:v1:public',
	Schema.Literal('categories', 'tags', 'folders', 'pages')
)(registry);
