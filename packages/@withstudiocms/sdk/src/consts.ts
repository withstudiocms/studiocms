/**
 * Cache tags used throughout the SDK.
 */
export const cacheTags = {
	dynamicConfig: ['dynamic-config'],
	npmPackage: ['npm-package'],
	plugins: ['plugins'],
	folder: ['folder'],
	folderTree: ['folder-tree'],
	folderList: ['folder-list'],
	pages: ['pages'],
	pageFolderTree: ['page-folder-tree'],
	middleware: ['middleware'],
	taxonomy: ['taxonomy'],
	tags: ['tags'],
	categories: ['categories'],
};

/**
 * Functions to generate cache keys for various SDK operations.
 */
export const cacheKeyGetters = {
	dynamicConfig: (id: string) => `dynamic-config:${id}`,
	npmPackage: (name: string, version: string) => `npm-package:${name.replace('/', '-')}:${version}`,
	plugins: (name: string) => `plugins:${name}`,
	folder: (folderId: string) => `folder:${folderId}`,
	folderTree: () => 'folder-tree',
	folderList: () => 'folder-list',
	page: (pageId: string) => `page:${pageId}`,
	pageFolderTree: (hideDefaultIndex: boolean) => `page-folder-tree:${hideDefaultIndex}`,
	middleware: () => 'middleware',
	tags: () => 'tags',
	categories: () => 'categories',
	categoryById: (categoryId: number) => `category:${categoryId}`,
	categoryBySlug: (slug: string) => `category-slug:${slug}`,
	tagById: (tagId: number) => `tag:${tagId}`,
	tagBySlug: (slug: string) => `tag-slug:${slug}`,
};
