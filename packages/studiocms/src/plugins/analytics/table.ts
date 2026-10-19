import { Database, DateFromString, encodeDatabase, Table } from '@withstudiocms/kysely/core/schema';
import type { TableDefinition } from '#db/plugins';
import { Schema } from '../../effect.js';

/**
 * StudioCMS Metric Table Definition
 */
export const StudioCMSMetricTable = Table({
	id: Schema.String,
	pathname: Schema.String,
	route: Schema.String,
	name: Schema.Literal('CLS', 'INP', 'LCP', 'FCP', 'TTFB'),
	value: Schema.Number,
	rating: Schema.Literal('good', 'needs-improvement', 'poor'),
	timestamp: DateFromString,
});

/**
 * StudioCMS Metric Database Schema Definition
 */
export const StudioCMSMetricDBSchema = Database({
	StudioCMSMetric: StudioCMSMetricTable,
});

/**
 * Encoded StudioCMS Metric Database Schema
 */
const StudioCMSMetricDBSchemaEncoded = encodeDatabase(StudioCMSMetricDBSchema);

/**
 * Type representing the StudioCMS Metric Database Schema.
 */
export type StudioCMSMetricDB = typeof StudioCMSMetricDBSchemaEncoded;

/**
 * Definition of the StudioCMS Metric Table for Kysely.
 */
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
