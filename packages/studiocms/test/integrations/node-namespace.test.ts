/** biome-ignore-all lint/suspicious/noExplicitAny: allowed in tests */
import type { AstroIntegration } from 'astro';
import { describe, expect, expectTypeOf } from 'vitest';
import { nodeNamespaceBuiltinsAstro, resolveBuiltIns } from '../../src/integrations/node-namespace';
import { allureTester } from '../fixtures/allureTester';
import { parentSuiteName, sharedTags } from '../test-utils';

const localSuiteName = 'Integrations tests (Node Namespace Built-ins)';

describe(parentSuiteName, () => {
	const test = allureTester({
		suiteName: localSuiteName,
		suiteParentName: parentSuiteName,
	});

	test('nodeNamespaceBuiltinsAstro integration existence', async ({ setupAllure, step }) => {
		const tags = [...sharedTags, 'integration:node-namespace-builtins'];

		await setupAllure({
			subSuiteName: 'nodeNamespaceBuiltinsAstro tests',
			tags: [...tags],
		});

		await step('Check integration creation', async () => {
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

		test(testName, async ({ setupAllure, step }) => {
			await setupAllure({
				subSuiteName: 'resolveBuiltIns tests',
				tags: [...tags],
				parameters: {
					id: id,
				},
			});

			await step(`Resolve built-in for id: ${id}`, async () => {
				const result = resolveBuiltIns(id);
				expect(result).toEqual(expected);
			});
		});
	});
});
