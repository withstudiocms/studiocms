import * as allure from 'allure-js-commons';
import { describe, expect, test } from 'vitest';
import {
	buildAliasExports,
	buildVirtualImport,
	InternalId,
	RuntimeInternalId,
} from '../../src/registry/consts.js';
import type { ComponentRegistryEntry } from '../../src/types.js';
import { parentSuiteName, sharedTags } from '../test-utils.js';

const localSuiteName = 'Registry Constants Tests';

describe(parentSuiteName, () => {
	[
		{
			componentKeys: ['Button', 'Input'],
			componentProps: [
				{
					name: 'Button',
					safeName: 'button',
					props: [{ name: 'Button', type: 'string', optional: false }],
				},
				{
					name: 'Input',
					safeName: 'input',
					props: [{ name: 'Input', type: 'string', optional: false }],
				},
			],
			components: ['export const Button = () => {};', 'export const Input = () => {};'],
			expectedToContain: [
				`export const componentKeys = ${JSON.stringify(['Button', 'Input'])};`,
				`export const componentProps = ${JSON.stringify([
					{
						name: 'Button',
						safeName: 'button',
						props: [{ name: 'Button', type: 'string', optional: false }],
					},
					{
						name: 'Input',
						safeName: 'input',
						props: [{ name: 'Input', type: 'string', optional: false }],
					},
				])};`,
				'export const Button = () => {};',
				'export const Input = () => {};',
			],
		},
		{
			componentKeys: [],
			componentProps: [],
			components: [],
			expectedToContain: [
				`export const componentKeys = ${JSON.stringify([])};`,
				`export const componentProps = ${JSON.stringify([])};`,
			],
		},
		{
			componentKeys: ['A'],
			componentProps: [{ name: 'A', safeName: 'a', props: {} }],
			components: [],
			expectedToContain: [
				`export const componentKeys = ${JSON.stringify(['A'])};`,
				`export const componentProps = ${JSON.stringify([{ name: 'A', safeName: 'a', props: {} }])};`,
			],
		},
	].forEach(({ componentKeys, componentProps, components, expectedToContain }) => {
		test('buildVirtualImport Test Case', async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('buildVirtualImport Tests');
			await allure.tags(...sharedTags);

			await allure.step('Generate virtual import code and verify contents', async (ctx) => {
				const result = buildVirtualImport(
					componentKeys,
					componentProps as ComponentRegistryEntry[],
					components
				);

				expectedToContain.forEach((expected) => {
					expect(result).toContain(expected);
				});

				ctx.parameter('componentKeys', JSON.stringify(componentKeys));
				ctx.parameter('componentProps', JSON.stringify(componentProps));
				ctx.parameter('components', JSON.stringify(components));
			});
		});
	});

	[
		{
			virtualId: 'my-module',
			expected: [
				{ property: 'my-module', value: `export * from '${InternalId}';` },
				{ property: 'my-module/runtime', value: `export * from '${RuntimeInternalId}';` },
			],
		},
		{
			virtualId: 'another-module',
			expected: [
				{ property: 'another-module', value: `export * from '${InternalId}';` },
				{ property: 'another-module/runtime', value: `export * from '${RuntimeInternalId}';` },
			],
		},
		{
			virtualId: 'test-module',
			expected: [
				{ property: 'test-module', value: `export * from '${InternalId}';` },
				{ property: 'test-module/runtime', value: `export * from '${RuntimeInternalId}';` },
			],
		},
	].forEach(({ virtualId, expected }) => {
		test('buildAliasExports Test Case', async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('buildAliasExports Tests');
			await allure.tags(...sharedTags);

			await allure.step('Generate alias exports and verify contents', async (ctx) => {
				const result = buildAliasExports(virtualId);

				expected.forEach(({ property, value }) => {
					expect(result).toHaveProperty(property, value);
				});

				ctx.parameter('virtualId', virtualId);
				ctx.parameter('expected', JSON.stringify(expected));
			});
		});
	});
});
