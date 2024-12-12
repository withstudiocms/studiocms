import { asc, db, desc, eq } from 'astro:db';
import { CMSSiteConfigId } from '../consts';
import { tsPageContent, tsPageData, tsPermissions, tsSiteConfig, tsUsers } from '../db/tsTables';
import { StudioCMSError } from '../errors';
import type { PageDataAndContent } from '../types';

/**
 * @deprecated
 */
export type UserResponse = PageDataAndContent['User'];
/**
 * @deprecated
 */
export type pageDataReponse = PageDataAndContent['PageData'];
/**
 * @deprecated
 */
export type pageContentReponse = PageDataAndContent['PageContent'];
/**
 * @deprecated
 */
export type SiteConfigResponse = PageDataAndContent['SiteConfig'];

// To be used in the future
//
// export type ContentHelperResponse = {
//     pageData: pageDataReponse;
//     pageContent: pageContentReponse[];
// }

/**
 * @deprecated
 */
export type ContentHelperTempResponse = {
	id: string;
	package: string;
	title: string;
	description: string;
	showOnNav: boolean;
	publishedAt: Date;
	updatedAt: Date | null;
	slug: string;
	contentLang: string | null;
	heroImage: string;
	content: string;
};

/**
 * A helper function to get the content of a page by its slug.
 *
 * @param slug The slug of the page to get the content of. Defined in the PageData table.
 * @param lang **Not implemented yet.** The language to get the content in. Default is 'default'.
 * @param pkg The package to get the content from. Default is '@astrolicious/studiocms'.
 * @returns The data and content of the page.
 *
 * @example
 * ```astro
 * ---
 * // Get the content of the index page:
 * import { StudioCMSRenderer, contentHelper } from 'studiocms:components'
 *
 * const { title, description, heroImage, content } = await contentHelper("index", "@astrolicious/studiocms")
 * ---
 *
 * <h1>{title}</h1>
 * <p>{description}</p>
 * <img src={heroImage} alt={title} />
 * <StudioCMSRenderer content={content} />
 *
 * ```
 */
/**
 * @deprecated
 */
export async function contentHelper(
	slug: string,
	pkg?: string
): Promise<ContentHelperTempResponse> {
	const slugToUse = slug;
	const packageToGet = pkg || 'studiocms';

	const pageData = await db.select().from(tsPageData).where(eq(tsPageData.slug, slugToUse)).get();

	if (!pageData) {
		return {} as ContentHelperTempResponse;
	}

	if (pageData.package && pageData.package !== packageToGet) {
		throw new StudioCMSError(
			`Page not found: ${slug} in package ${packageToGet}`,
			`studioCMS contentHelper Failed to get page data for page ${slug} in package ${packageToGet}`
		);
	}

	const langToGet = 'default';

	const pageContent = await db
		.select()
		.from(tsPageContent)
		.where(eq(tsPageContent.contentId, pageData.id))
		.get();

	if (!pageContent) {
		throw new StudioCMSError(
			`Page Content not found: ${slug} with language ${langToGet}`,
			`studioCMS contentHelper Failed to get page content for page ${slug} with language ${langToGet}`
		);
	}
	return { ...pageData, content: pageContent.content || 'Failed to fetch Content' };
}

/**
 * @deprecated
 */
export async function getPageById(id: string): Promise<ContentHelperTempResponse> {
	const pageData = await db.select().from(tsPageData).where(eq(tsPageData.id, id)).get();

	if (!pageData) {
		return {} as ContentHelperTempResponse;
	}

	const langToGet = 'default';

	const pageContent = await db
		.select()
		.from(tsPageContent)
		.where(eq(tsPageContent.contentId, pageData.id))
		.get();

	if (!pageContent) {
		throw new StudioCMSError(
			`Page Content not found: ${id} with language ${langToGet}`,
			`studioCMS contentHelper Failed to get page content for page ${id} with language ${langToGet}`
		);
	}
	return { ...pageData, content: pageContent.content || 'Failed to fetch Content' };
}

/**
 * Get page list helper function to get a list of all pages from Astro Studio's database.
 *
 * @returns A Array of all pages in the database in ascending order of their published date.
 */
/**
 * @deprecated
 */
export async function getPageList(): Promise<pageDataReponse[]> {
	const pageData = await db.select().from(tsPageData).orderBy(asc(tsPageData.publishedAt));

	if (!pageData) {
		return [] as pageDataReponse[];
	}

	return pageData;
}

/**
 * Site Configuration helper function to get the site configuration data from Astro Studio's Database.
 *
 * @returns The site configuration data. (Title, Description)
 */
/**
 * @deprecated
 */
export async function getSiteConfig(): Promise<SiteConfigResponse> {
	const config: PageDataAndContent['SiteConfig'] | undefined = await db
		.select()
		.from(tsSiteConfig)
		.where(eq(tsSiteConfig.id, CMSSiteConfigId))
		.get();

	if (!config || config === undefined) {
		return {
			id: CMSSiteConfigId,
			title: 'StudioCMS',
			description: 'A CMS for Astro.',
		} as SiteConfigResponse;
	}

	return {
		id: config.id,
		title: config.title,
		description: config.description,
	};
}

/**
 * Get user by ID helper function to get a user by their ID from Astro Studio's Database.
 *
 * @param userId The ID of the user to get. You can get this from `Astro.locals.dbUser.id` when StudioCMS Auth middleware is used.
 * @returns The user data.
 */
/**
 * @deprecated
 */
export async function getUserById(userId: string): Promise<UserResponse> {
	const user = await db.select().from(tsUsers).where(eq(tsUsers.id, userId)).get();

	if (!user) {
		return {} as UserResponse;
	}

	return user;
}

/**
 * Get user list helper function to get a list of all users from Astro Studio's Database.
 *
 * @returns A Array of all users in the database.
 */
/**
 * @deprecated
 */
export async function getUserList(): Promise<UserResponse[]> {
	const users: UserResponse[] = await db.select().from(tsUsers).orderBy(desc(tsUsers.name));

	if (!users) {
		return [] as UserResponse[];
	}

	return users;
}

/**
 * Get permissions list helper function to get a list of all permissions from Astro Studio's Database.
 *
 * @returns An Array of all permissions in the database.
 */
/**
 * @deprecated
 */
export async function getPermissionsList(): Promise<PageDataAndContent['Permissions'][]> {
	const permissions = await db.select().from(tsPermissions);

	if (!permissions) {
		return [] as PageDataAndContent['Permissions'][];
	}

	return permissions;
}
