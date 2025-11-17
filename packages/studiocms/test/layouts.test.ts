/// <reference types="astro/client" />
import { describe, expect } from 'vitest';
import AuthLayout from '../src/frontend/layouts/AuthLayout.astro';
import FirstTimeSetupLayout from '../src/frontend/layouts/FirstTimeSetupLayout.astro';
import { allureTester } from './fixtures/allureTester';
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

		allureTester({
			suiteName: localSuiteName,
			suiteParentName: parentSuiteName,
		})(testName, async ({ setupAllure, renderComponent, step }) => {
			await setupAllure({
				subSuiteName: testName,
				tags: tags,
				parameters: { component: name },
			});

			await step(`Rendering ${name} component`, async (ctx) => {
				const result = await renderComponent(component, name, opts);
				await ctx.parameter('renderedOutput', result);
				expect(result).toMatchSnapshot();
			});
		});
	});
});
