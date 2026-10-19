import { ParseResult } from 'effect';
import * as Schema from 'effect/Schema';

/**
 * Schema for validating and transforming client-submitted web performance metric ratings. The input must be one of the following strings: 'good', 'needs-improvement', or 'poor'. This schema ensures that only valid rating values are accepted and provides a clear definition of the expected values for the rating field in client-submitted data.
 */
export const RatingSchema = Schema.Literal('good', 'needs-improvement', 'poor');

/**
 * Schema for validating and transforming client-submitted web performance metric types. The input must be one of the following strings: 'CLS', 'INP', 'LCP', 'FCP', or 'TTFB'. This schema ensures that only valid metric types are accepted and provides a clear definition of the expected values for the metric type field in client-submitted data.
 */
export const MetricTypeSchema = Schema.Literal('CLS', 'INP', 'LCP', 'FCP', 'TTFB');

/**
 * Schema for validating and transforming client-submitted web performance metric IDs. The input must be a string matching the pattern `v5-<13 digits>-<13 digits>`. The schema transforms the ID by removing the last 5 digits of the first numeric segment to reduce data resolution while maintaining uniqueness. This transformation helps to balance the need for unique identifiers with privacy considerations by reducing the granularity of the data.
 */
export const MetricIdSchema = Schema.transformOrFail(Schema.String, Schema.String, {
	strict: true,
	decode: (input, _options, ast) => {
		if (typeof input !== 'string') {
			return ParseResult.fail(new ParseResult.Type(ast, input, 'Expected a string for Metric ID'));
		}
		const regex = /^v5-\d{13}-\d{13}$/;
		if (!regex.test(input)) {
			return ParseResult.fail(
				new ParseResult.Type(
					ast,
					input,
					'Metric ID must match the pattern v5-<13 digits>-<13 digits>'
				)
			);
		}
		const transformedId = input.replace(/^(v5-\d{8})\d{5}(-\d{13})$/, '$1$2');
		return ParseResult.succeed(transformedId);
	},
	encode: (input) => ParseResult.succeed(input),
}).annotations({
	title: 'Metric ID',
	identifier: 'MetricId',
	description: 'A `web-vitals` generated ID, transformed to reduce data resolution.',
});

/**
 * Schema representing a client-submitted web performance metric, including its type, value, and associated metadata.
 */
export const ClientMetricSchema = Schema.Struct({
	pathname: Schema.String,
	route: Schema.String,
	name: MetricTypeSchema,
	id: MetricIdSchema,
	value: Schema.Number.pipe(Schema.greaterThan(0)).annotations({
		description: 'The value of the metric, must be a non-negative number.',
	}),
	rating: RatingSchema,
}).annotations({
	title: 'Client Metric',
	identifier: 'ClientMetric',
	description:
		'Schema representing a client-submitted web performance metric, including its type, value, and associated metadata.',
});

/**
 * Schema for server-stored metrics, which includes all fields from the client-submitted metric along with a timestamp. The timestamp is generated on the server to indicate when the metric was processed, and the ID is transformed to reduce data resolution while maintaining uniqueness.
 */
export const ServerMetricSchemaBase = Schema.Struct({
	...ClientMetricSchema.fields,
	timestamp: Schema.DateFromSelf,
}).annotations({
	title: 'Server Metric',
	identifier: 'ServerMetric',
	description:
		'Schema representing a server-stored web performance metric, including all client-submitted fields and a timestamp indicating when the metric was processed.',
});

/**
 * Schema for server-stored metrics, which includes all fields from the client-submitted metric along with a timestamp. The timestamp is generated on the server to indicate when the metric was processed, and the ID is transformed to reduce data resolution while maintaining uniqueness.
 */
export const ServerMetricSchema = Schema.transform(ClientMetricSchema, ServerMetricSchemaBase, {
	strict: true,
	decode: (input) => {
		const timestamp = new Date();
		timestamp.setMinutes(0, 0, 0);
		return { ...input, timestamp };
	},
	encode: (input) => {
		const { timestamp, ...rest } = input;
		return rest;
	},
});

/** Type representing the shape of client-submitted metrics. */
export type ClientMetric = typeof ClientMetricSchema.Type;
