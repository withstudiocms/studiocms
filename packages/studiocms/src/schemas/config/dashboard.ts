import * as Schema from 'effect/Schema';
import {
	BooleanDefaultFalse,
	BooleanDefaultTrue,
	OptionalWithDefaults,
	StringWithDefault,
} from '../custom.js';

/**
 * Schema for the security configuration of the dashboard.
 */
export const SecurityConfigSchema = Schema.Struct({
	hideGeneratorTags: BooleanDefaultFalse.annotations({
		description: 'Hide Generator Tags - Hides generator tags in the HTML output of the dashboard',
	}),
}).annotations({
	title: 'Dashboard Security Configuration',
	description: 'Configuration options related to the security of the dashboard',
	identifier: 'DashboardSecurityConfig',
});

/**
 * Schema for the dashboard configuration.
 */
export const DashboardConfigSchema = Schema.Struct({
	dashboardEnabled: BooleanDefaultTrue.annotations({
		description: 'Dashboard Enabled - Allows enabling or disabling of the dashboard',
	}),
	inject404Route: BooleanDefaultTrue.annotations({
		description: 'Inject 404 Route - Allows injecting a 404 route for the dashboard',
	}),
	faviconURL: StringWithDefault('/favicon.svg').annotations({
		description: 'Favicon URL - Allows overriding the default Favicon URL to a custom URL',
	}),
	dashboardRouteOverride: Schema.optional(Schema.String).annotations({
		description:
			'Dashboard Route Override - Allows overriding the default dashboard route to a custom route',
		usage:
			'The default route is `dashboard` without any `/` or `\\` characters. If you want to override the route to `/admin` you would set this value to `admin`',
	}),
	versionCheck: BooleanDefaultTrue.annotations({
		description:
			'Version Check - Allows enabling or disabling of the version check for the dashboard',
	}),
	security: OptionalWithDefaults(SecurityConfigSchema, {}).annotations({
		description: 'Security Configuration - Allows configuring security settings for the dashboard',
	}),
}).annotations({
	title: 'Dashboard Configuration',
	description: 'Configuration options related to the dashboard',
	identifier: 'DashboardConfig',
});

/**
 * Type for the dashboard configuration.
 */
export type DashboardConfig = typeof DashboardConfigSchema.Encoded;

/**
 * Resolved type for the dashboard configuration.
 */
export type DashboardConfigResolved = typeof DashboardConfigSchema.Type;
