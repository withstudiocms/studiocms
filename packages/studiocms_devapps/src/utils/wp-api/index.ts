import type { tsPageContent, tsPageData } from '@studiocms/core/sdk-utils/tables';

export type PageData = typeof tsPageData.$inferInsert;
export type PageContent = typeof tsPageContent.$inferInsert;

export * from './pages.js';
export * from './posts.js';
export * from './settings.js';
