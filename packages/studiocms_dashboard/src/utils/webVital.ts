// @ts-nocheck
import { logger } from '@it-astro:logger:studiocms-dashboard';
import { column, db, defineTable } from 'astro:db';
import { asDrizzleTable } from '@astrojs/db/utils';

export type WebVitalsResponseItem = {
	id: string;
	pathname: string;
	route: string;
	name: string;
	value: number;
	rating: string;
	timestamp: Date;
};

// Table definition from `@astrojs/web-vitals` db-config
const Metric = defineTable({
	columns: {
		pathname: column.text(),
		route: column.text(),
		name: column.text(),
		id: column.text({ primaryKey: true }),
		value: column.number(),
		rating: column.text(),
		timestamp: column.date(),
	},
	deprecated: Boolean(process.env.DEPRECATE_WEB_VITALS) ?? false,
});

const tsMetric = asDrizzleTable('AstrojsWebVitals_Metric', Metric);

export async function getWebVitals(): Promise<WebVitalsResponseItem[]> {
	try {
		const AstroDB = await import('astro:db');

		if ('AstrojsWebVitals_Metric' in AstroDB) {
			if (AstroDB.AstrojsWebVitals_Metric) {
				const webVitals = await db.select().from(tsMetric);
				return webVitals as WebVitalsResponseItem[];
			}
		}
	} catch (error) {
		logger.warn(
			`Error getting @astrojs/web-vitals table data.  If you have not installed the package you can disregard this error.\n - ${error}`
		);
		return [] as WebVitalsResponseItem[];
	}

	return [] as WebVitalsResponseItem[];
}
