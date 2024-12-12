import { randomUUID } from 'node:crypto';
import { logger } from '@it-astro:logger:studiocms-dashboard';
import { db, eq } from 'astro:db';
import { CMSSiteConfigId } from '@studiocms/core/consts';
import { tsPageContent, tsPageData, tsSiteConfig } from '@studiocms/core/db/tsTables';

/**
 * @deprecated moved into StudioCMS SDK
 */
type PageDataInsert = typeof tsPageData.$inferInsert;
/**
 * @deprecated moved into StudioCMS SDK
 */
type PageDataSelect = typeof tsPageData.$inferSelect;
/**
 * @deprecated moved into StudioCMS SDK
 */
type PageDataReturnID = Pick<PageDataSelect, 'id'>;

/**
 * @deprecated moved into StudioCMS SDK
 */
type PageContentInsert = typeof tsPageContent.$inferInsert;
/**
 * @deprecated moved into StudioCMS SDK
 */
type PageContentSelect = typeof tsPageContent.$inferSelect;

/**
 * @deprecated moved into StudioCMS SDK
 */
type SiteConfigInsert = typeof tsSiteConfig.$inferInsert;
/**
 * @deprecated moved into StudioCMS SDK
 */
type SiteConfigSelect = typeof tsSiteConfig.$inferSelect;

/**
 * @deprecated moved into StudioCMS SDK
 */
export const astroDb = () => {
	return {
		pageData() {
			return {
				async getBySlug(slug: string, pkg: string): Promise<PageDataSelect | undefined> {
					const pageData = await db
						.select()
						.from(tsPageData)
						.where(eq(tsPageData.slug, slug))
						.get();

					if (pageData?.package !== pkg) {
						return undefined;
					}
					return pageData;
				},
				async insertPageData(data: PageDataInsert): Promise<PageDataReturnID | undefined> {
					// TODO: This is for i18n support in the future
					const contentLang = 'default';

					const newEntry = await db
						.insert(tsPageData)
						.values({
							id: randomUUID(),
							slug: data.slug,
							title: data.title,
							package: data.package || 'studiocms',
							description: data.description,
							contentLang: contentLang,
							heroImage: data.heroImage || '',
							publishedAt: data.publishedAt || new Date(),
							showOnNav: data.showOnNav || false,
							catagories: data.catagories || [],
							tags: data.tags || [],
							updatedAt: new Date(),
						})
						.returning({ id: tsPageData.id })
						.catch((error) => {
							logger.error(error);
							return [];
						});

					return newEntry.pop();
				},
				async update(data: PageDataSelect) {
					await db
						.update(tsPageData)
						.set({
							title: data.title,
							description: data.description,
							slug: data.slug,
							package: data.package,
							showOnNav: data.showOnNav,
							heroImage: data.heroImage,
							updatedAt: data.updatedAt,
						})
						.where(eq(tsPageData.id, data.id))
						.catch((error) => {
							logger.error(error);
						});
				},
				async delete(id: string) {
					await db.delete(tsPageData).where(eq(tsPageData.id, id));
				},
			};
		},
		pageContent() {
			return {
				async insert(data: PageContentInsert) {
					await db
						.insert(tsPageContent)
						.values({
							id: randomUUID(),
							contentId: data.contentId,
							contentLang: data.contentLang || 'default',
							content: data.content || '',
						})
						.catch((error) => {
							logger.error(error);
						});
				},
				async update(data: PageContentSelect) {
					await db
						.update(tsPageContent)
						.set({ content: data.content })
						.where(eq(tsPageContent.contentId, data.id));
				},
				async delete(id: string) {
					await db.delete(tsPageContent).where(eq(tsPageContent.contentId, id));
				},
			};
		},
		siteConfig() {
			return {
				async update(data: SiteConfigInsert): Promise<SiteConfigSelect | undefined> {
					return await db
						.update(tsSiteConfig)
						.set(data)
						.where(eq(tsSiteConfig.id, CMSSiteConfigId))
						.returning()
						.get();
				},
			};
		},
	};
};
