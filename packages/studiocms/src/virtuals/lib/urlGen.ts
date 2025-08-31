import { createURLGenFactory } from '@withstudiocms/internal_helpers/urlGenFactory';

const urlGenFactory = createURLGenFactory('dashboard');

/**
 * # urlGenFactory Helper Function
 *
 * Generate a URL based on the path and route type.
 *
 * @param isDashboardRoute
 * @param path
 * @param DashboardRouteOverride
 * @returns
 */
export default urlGenFactory;
