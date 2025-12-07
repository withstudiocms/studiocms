import { Database, DateFromString, encodeDatabase, Schema, Table } from '@withstudiocms/kysely';
import type { TableDefinition } from '#db/plugins';

export const StudioCMSMetricTable = Table({
	id: Schema.String,
	pathname: Schema.String,
	route: Schema.String,
	name: Schema.Literal('CLS', 'INP', 'LCP', 'FCP', 'TTFB'),
	value: Schema.Number,
	rating: Schema.Literal('good', 'needs-improvement', 'poor'),
	timestamp: DateFromString,
});

export const StudioCMSMetricDBSchema = Database({
	StudioCMSMetric: StudioCMSMetricTable,
});

const StudioCMSMetricDBSchemaEncoded = encodeDatabase(StudioCMSMetricDBSchema);

export type StudioCMSMetricDB = typeof StudioCMSMetricDBSchemaEncoded;

export const StudioCMSMetricTableDefinition: TableDefinition = {
	name: 'StudioCMSMetric',
	columns: [
		{ name: 'id', type: 'text', primaryKey: true },
		{ name: 'pathname', type: 'text' },
		{ name: 'route', type: 'text' },
		{ name: 'name', type: 'text' },
		{ name: 'value', type: 'integer' },
		{ name: 'rating', type: 'text' },
		{ name: 'timestamp', type: 'text' },
	],
};
