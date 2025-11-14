/// <reference types="astro/client" />
import * as allure from 'allure-js-commons';
import { describe, expect } from 'vitest';
import AuthLayout from '../src/frontend/layouts/AuthLayout.astro';
import FirstTimeSetupLayout from '../src/frontend/layouts/FirstTimeSetupLayout.astro';
import { test } from './fixtures/AstroContainer';
import { parentSuiteName, sharedTags } from './test-utils';

const localSuiteName = 'Layout Container tests';

describe(parentSuiteName, () => {
	[
		{
			component: FirstTimeSetupLayout,
			name: 'FirstTimeSetupLayout',
			opts: { props: { title: 'Test Title', description: 'Test Description' } },
		},
		{
			component: AuthLayout,
			name: 'AuthLayout',
			opts: { props: { title: 'Test Title', description: 'Test Description', lang: 'en' } },
		},
	].forEach(({ component, name, opts }) => {
		const testName = `${localSuiteName} - ${name} component`;
		const tags = [...sharedTags, 'component:layouts', `component:${name}`];

		test(testName, async ({ renderComponent }) => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite('Layout Container tests');
			await allure.subSuite(testName);
			await allure.tags(...tags);

			await allure.parameter('component', name);

			await allure.step(`Rendering ${name} component`, async (ctx) => {
				const result = await renderComponent(component, name, opts);
				await ctx.parameter('renderedOutput', result);
				expect(result).toMatchSnapshot();
			});
		});
	});
});
