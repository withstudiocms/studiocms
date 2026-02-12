import * as os from 'node:os';
import { defineConfig } from 'vitest/config';

/**
 * Array describing groups of projects that have tests.
 *
 * Each entry in the array represents a logical grouping of package names:
 * - scope?: Optional npm scope (without the leading '@'). When present, package names
 *   in `names` are intended to be resolved as `@{scope}/{name}`.
 * - names: Required array of package names (strings) that belong to the group.
 *
 * Purpose:
 * - Used to enumerate packages for which tests should be run, in the order provided.
 * - Consumers typically map each entry to concrete package identifiers (e.g. prefixing
 *   names with `@${scope}/` when `scope` is present) and then trigger test runs.
 *
 * Constraints and expectations:
 * - `scope` should be the raw scope identifier (e.g. "studiocms"), not including the '@'.
 * - Each `names` array should contain at least one non-empty string.
 * - Avoid duplicate full package identifiers across entries to prevent redundant test execution.
 *
 * Usage notes:
 * - To construct a full package name: scope ? `@${scope}/${name}` : `${name}`.
 * - The array's order may be significant for orchestration, reporting, or batching of test runs.
 *
 * Extensibility:
 * - Add additional group objects to include more packages.
 * - To represent a top-level package without a scope, supply an object with only `names`.
 */
const projectsWithTests: { scope?: string; names: string[] }[] = [
	{
		scope: 'withstudiocms',
		names: [
			'auth-kit',
			'buildkit',
			'cli-kit',
			'component-registry',
			'config-utils',
			'effect',
			'internal_helpers',
			'template-lang',
			'kysely',
			'sdk',
		],
	},
	{
		scope: 'studiocms',
		names: [
			'auth0',
			'discord',
			'github',
			'google',
			'devapps',
			'html',
			'cloudinary-image-service',
			'md',
			'mdx',
			'blog',
			'markdoc',
			'wysiwyg',
		],
	},
	{
		names: ['studiocms', 'effectify'],
	},
];

export default defineConfig({
	test: {
		projects: projectsWithTests.flatMap(({ scope, names }) =>
			scope
				? names.map((name) => `packages/@${scope}/${name}`)
				: names.map((name) => `packages/${name}`)
		),
		setupFiles: ['allure-vitest/setup'],
		reporters: [
			'default',
			[
				'junit',
				{
					outputFile: './junit-report.xml',
				},
			],
			[
				'allure-vitest/reporter',
				{
					resultsDir: 'allure-results',
					links: {
						issue: {
							nameTemplate: 'Issue #%s',
							urlTemplate: 'https://github.com/withstudiocms/studiocms/issues/%s',
						},
					},
					environmentInfo: {
						os_platform: os.platform(),
						os_release: os.release(),
						os_version: os.version(),
						node_version: process.version,
					},
					globalLabels: {
						owner: 'withstudiocms',
						lead: 'Adam Matthiesen',
						framework: 'Vitest',
						language: 'TypeScript/JavaScript',
					},
				},
			],
		],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json'],
			exclude: [
				'audit/**',
				'bundle-tests/**',
				'scripts/**',
				'playground/**',
				'archive/**',
				'knip.config.ts',
				'.github/**',
				'vitest.config.ts',
				'**/**/vitest.config.ts',
				'**/**/@withstudiocms/auth-kit/scripts/**',
				'**/**/@withstudiocms/kysely/src/migrations/**',
				'**/**/@withstudiocms/kysely/scripts/**',
				'**/**/@withstudiocms/kysely/src/{tables,schema,migrator,index,client}.ts',
				'**/**/@withstudiocms/kysely/src/drivers/**',
				'**/**/scratchpad/**',
				'**/**/test/fixtures/**',
				'**/**/test/test-utils.ts',
				'**/**/test/test-utils.js',
				'**/**/runtime.ts',
				// This is a minified Script used by @studiocms/md that is being injected using an Astro Component
				'**/**/components/TinyMDE.astro',
				// Exclude files from runtime only paths
				'**/routes/**',
				'**/frontend/**',
				'**/runtime/**',
				'**/dist/**',
				'**/studiocms/studiocms-cli.mjs',
				'**/db/config.ts',
				'**/virtuals/stubs/**',
				'**/virtuals/plugins/**',
				'**/virtuals/notifier/index.ts',
				'**/virtuals/mailer/index.ts',
				'**/virtuals/i18n/v-files.ts',
				'**/virtuals/auth/scripts/**',
				'**/virtuals/auth/core.ts',
				'**/virtuals/auth/index.ts',
				'**/virtuals/auth/verify-email.ts',
				'**/webVitals/dashboard-grid-items/**',
				'**/webVitals/pages/**',
				'**/studiocms/src/handlers/**',
				'**/virtuals/i18n/LanguageSelector.astro',
				'**/virtuals/i18n/plugin.ts',
				'**/integrations/webVitals/i18n/*.ts',
				'**/effectify/src/_internal/**',
			],
		},
	},
});
