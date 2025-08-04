import { pathWithBase, StudioCMSRoutes } from 'studiocms:lib';
import plugins from 'studiocms:plugins';
import { runSDK, SDKCoreJs } from 'studiocms:sdk';

// Define the link props for the navigation
type LinkProps = {
	text: string;
	href: string;
};

/**
 * Generate the frontend navigation links
 *
 * @param basePackage The package to search for the pages (default: 'studiocms/markdown')
 * @returns The frontend navigation links
 * @example
 * ```ts
 * import { frontendNavigation } from 'studiocms:lib/plugins/frontend-navigation';
 *
 * const links = await frontendNavigation();
 * ```
 */
export async function frontendNavigation(basePackage?: string): Promise<LinkProps[]> {
	const searchPackage = basePackage || 'studiocms/markdown';

	const fullPageList = await runSDK(SDKCoreJs.GET.pages());
	const pageListData = fullPageList.map(({ data }) => data);

	// Define the links for the navigation
	const links: LinkProps[] = [];

	// Get the pages that are set to show on the navigation
	const navPagesList = pageListData
		.filter((page) => page.showOnNav === true && page.package === searchPackage)
		// biome-ignore lint/style/noNonNullAssertion: We know that `publishedAt` is always defined for published pages
		.sort((a, b) => Date.parse(b.publishedAt!.toString()) - Date.parse(a.publishedAt!.toString()));

	// Get the index page
	const indexPage = navPagesList.find((page) => page.slug === 'index');

	// Add the main site URL to the links
	if (indexPage) {
		links.push({
			text: indexPage.title || 'Home',
			href: StudioCMSRoutes.mainLinks.baseSiteURL,
		});
	}

	// Get the rest of the pages that are set to show on the navigation
	const restOfPages = navPagesList.filter((page) => page.slug !== 'index');

	// Add the rest of the pages to the links
	for (const page of restOfPages) {
		links.push({
			text: page.title,
			href: pathWithBase(page.slug),
		});
	}

	// Add the frontend navigation links from the plugins
	for (const { frontendNavigationLinks } of plugins) {
		if (!frontendNavigationLinks) {
			continue;
		}
		for (const link of frontendNavigationLinks) {
			links.push({
				text: link.label,
				href: pathWithBase(link.href),
			});
		}
	}

	return links;
}
