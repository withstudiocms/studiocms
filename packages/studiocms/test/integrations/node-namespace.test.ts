/** biome-ignore-all lint/suspicious/noExplicitAny: allowed in tests */
import * as allure from 'allure-js-commons';
import type { AstroIntegration } from 'astro';
import { describe, expect, expectTypeOf, test } from 'vitest';
import { nodeNamespaceBuiltinsAstro, resolveBuiltIns } from '../../src/integrations/node-namespace';
import { parentSuiteName, sharedTags } from '../test-utils';

const localSuiteName = 'Integrations tests (Node Namespace Built-ins)';

describe(parentSuiteName, () => {
	test('nodeNamespaceBuiltinsAstro integration existence', async () => {
		const tags = [...sharedTags, 'integration:node-namespace-builtins'];

		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('nodeNamespaceBuiltinsAstro tests');
		await allure.tags(...tags);

		await allure.step('Check integration creation', async () => {
			const integration = nodeNamespaceBuiltinsAstro();
			expect(integration).toBeDefined();
			expect(integration.name).toBe('vite-namespace-builtins');
			expect(typeof integration.hooks['astro:config:setup']).toBe('function');
			expectTypeOf(integration).toEqualTypeOf<AstroIntegration>();
		});
	});

	[
		{
			id: './fs',
			expected: undefined,
		},
		{
			id: '../path',
			expected: undefined,
		},
		{
			id: '/fs',
			expected: undefined,
		},
		{
			id: '',
			expected: undefined,
		},
		{
			id: 'some-nonexistent-module',
			expected: undefined,
		},
		{
			id: 'astro',
			expected: undefined,
		},
		{
			id: 'fs',
			expected: { id: 'node:fs', external: true },
		},
		{
			id: 'node:path',
			expected: { id: 'node:path', external: true },
		},
		{
			id: 'fs/promises',
			expected: { id: 'node:fs/promises', external: true },
		},
		{
			id: 'node:fs/promises',
			expected: { id: 'node:fs/promises', external: true },
		},
	].forEach(({ id, expected }, index) => {
		const testName = `resolveBuiltIns test case #${index + 1}`;
		const tags = [...sharedTags, 'integration:node-namespace-builtins', 'function:resolveBuiltIns'];

		test(testName, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('resolveBuiltIns tests');
			await allure.tags(...tags);

			await allure.parameter('id', id);

			await allure.step(`Resolve built-in for id: ${id}`, async () => {
				const result = resolveBuiltIns(id);
				expect(result).toEqual(expected);
			});
		});
	});
});
