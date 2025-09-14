import { configResolverBuilder, watchConfigFileBuilder } from '@withstudiocms/config-utils';
import type { AstroIntegration } from 'astro';
import { defineConfig } from 'astro/config';
import { z } from 'astro/zod';
import { addVirtualImports } from 'astro-integration-kit';

const configPaths = ['example.config.mjs'];

const zodSchema = z.object({
	foo: z.string().optional(),
	bar: z.number().min(0).optional(),
});

const label = 'test-integration';

const testIntegration: AstroIntegration = {
	name: label,
	hooks: {
		'astro:config:setup': async (params) => {
			const testReports = { logs: [] as string[], errors: [] as string[] };

			const watchConfigFile = watchConfigFileBuilder({ configPaths, _test_report: testReports });
			const configResolver = configResolverBuilder({
				configPaths,
				label,
				zodSchema,
			});

			watchConfigFile(params);

			const resolvedConfig = await configResolver(params, {});

			addVirtualImports(params, {
				name: label,
				imports: {
					'virtual:test-config': `export const config = ${JSON.stringify(resolvedConfig)}`,
					'virtual:test-reports': `export const reports = ${JSON.stringify(testReports)}`,
				},
			});
		},
	},
};

// https://astro.build/config
export default defineConfig({
	integrations: [testIntegration],
	output: 'static',
	devToolbar: {
		enabled: false,
	},
});
