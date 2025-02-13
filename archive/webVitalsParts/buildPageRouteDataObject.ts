import type { WebVitalsResponseItem } from 'studiocms-dashboard:web-vitals';
import { checkDate } from './checkDate';

type pageRouteDataEntry = {
	pagePathname: string;
	analyticData: {
		pageRoute: string;
		pageViews: number;
	};
};
// build page route analytics
export const buildPageRouteDataObject = (webVitalData: WebVitalsResponseItem[]) => {
	const perRouteData: pageRouteDataEntry[] = [];
	const last24HoursData: pageRouteDataEntry[] = [];
	const last7DaysData: pageRouteDataEntry[] = [];
	const last30DaysData: pageRouteDataEntry[] = [];

	if (webVitalData.length > 0) {
		for (const item of webVitalData) {
			const { pathname, route, timestamp } = item;

			if (checkDate(timestamp).isInLast24Hours()) {
				const index = last24HoursData.findIndex((entry) => entry.pagePathname === pathname);
				if (index !== -1) {
					// @ts-expect-error - This is a valid index
					last24HoursData[index].analyticData.pageViews += 1;
				} else {
					last24HoursData.push({
						pagePathname: pathname,
						analyticData: {
							pageRoute: route,
							pageViews: 1,
						},
					});
				}
			}

			if (checkDate(timestamp).isInLast7Days()) {
				const index = last7DaysData.findIndex((entry) => entry.pagePathname === pathname);
				if (index !== -1) {
					// @ts-expect-error - This is a valid index
					last7DaysData[index].analyticData.pageViews += 1;
				} else {
					last7DaysData.push({
						pagePathname: pathname,
						analyticData: {
							pageRoute: route,
							pageViews: 1,
						},
					});
				}
			}

			if (checkDate(timestamp).isInLast30Days()) {
				const index = last30DaysData.findIndex((entry) => entry.pagePathname === pathname);
				if (index !== -1) {
					// @ts-expect-error - This is a valid index
					last30DaysData[index].analyticData.pageViews += 1;
				} else {
					last30DaysData.push({
						pagePathname: pathname,
						analyticData: {
							pageRoute: route,
							pageViews: 1,
						},
					});
				}
			}

			const index = perRouteData.findIndex((entry) => entry.pagePathname === pathname);
			if (index !== -1) {
				// @ts-expect-error - This is a valid index
				perRouteData[index].analyticData.pageViews += 1;
			} else {
				perRouteData.push({
					pagePathname: pathname,
					analyticData: {
						pageRoute: route,
						pageViews: 1,
					},
				});
			}
		}
	}
	return { last24HoursData, last7DaysData, last30DaysData, perRouteData };
};
