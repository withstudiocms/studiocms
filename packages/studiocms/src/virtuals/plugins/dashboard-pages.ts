import adminPages from 'studiocms:plugins/dashboard-pages/admin';
import userPages from 'studiocms:plugins/dashboard-pages/user';

/**
 * Retrieves the dashboard pages for the plugins.
 *
 * @returns An object containing `userPages` and `adminPages`.
 */
export function getPluginDashboardPages() {
	return {
		userPages,
		adminPages,
	};
}
