/**
 * Constructs a public route path for StudioCMS resources.
 *
 * @param route - The specific route to be appended to the public path.
 * @returns The full public path for the given route.
 */
export function makePublicRoute(route: string) {
	return `public/studiocms-resources/${route}/`;
}
