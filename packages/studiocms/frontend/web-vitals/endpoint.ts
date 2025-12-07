import { config } from 'studiocms:config';
import { runEffect, Schema } from '@withstudiocms/effect';
import { sql } from '@withstudiocms/kysely/kysely';
import type { APIRoute } from 'astro';
import { getAnalyticsDbClient } from '#analytics/db-client';
import { ServerMetricSchema } from '#analytics/schemas';
import { StudioCMSMetricTable } from '#analytics/table';

export const prerender = false;

export const ALL: APIRoute = async ({ request }) => {
	try {
		const rawBody = await request.json();
		const body = ServerMetricSchema.array().parse(rawBody);
		const db = await runEffect(getAnalyticsDbClient(config.db.dialect));

		const insert = db.withEncoder({
			encoder: Schema.Array(StudioCMSMetricTable.Insert),
			callbackFn: (client, body) =>
				client((db) =>
					db
						.insertInto('StudioCMSMetric')
						.values(body)
						.onConflict((oc) => oc.column('id').doUpdateSet({ value: sql`excluded.value` }))
						.execute()
				),
		});

		const safeBody = body.map(({ timestamp, ...item }) => ({
			...item,
			timestamp: timestamp.toISOString(),
		}));

		await runEffect(insert(safeBody));
	} catch (error) {
		console.error(error);
	}
	return new Response();
};
