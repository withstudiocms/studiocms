/// <reference types="astro/client" />
import * as allure from 'allure-js-commons';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, test } from 'vitest';
import Layout from '../../src/layouts/Layout.astro';
import { cleanAstroAttributes, MockAstroLocals, parentSuiteName, sharedTags } from '../test-utils';

const localSuiteName = 'Layout Component Tests';

describe(parentSuiteName, () => {
	test('Layout renders correctly', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('Layout Component Tests');
		await allure.tags(...sharedTags);

		const container = await AstroContainer.create();
		const result = await container.renderToString(Layout, {
			props: {
				title: 'Test Page',
				description: 'This is a test page',
			},
			locals: MockAstroLocals(),
		});

		await allure.step('Verifying rendered HTML structure and content', async (ctx) => {
			const cleaned = cleanAstroAttributes(result, '/mock/path/Layout.astro');

			await ctx.parameter('Rendered Output', cleaned);

			expect(cleaned).toMatchSnapshot();
		});
	});
});
