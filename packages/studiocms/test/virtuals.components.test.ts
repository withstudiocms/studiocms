/// <reference types="astro/client" />
import * as allure from 'allure-js-commons';
import { describe, expect } from 'vitest';
import CustomImage from '../src/virtuals/components/CustomImage.astro';
import FormattedDate from '../src/virtuals/components/FormattedDate.astro';
import Generator from '../src/virtuals/components/Generator.astro';
import Renderer from '../src/virtuals/components/Renderer.astro';
import { test } from './fixtures/AstroContainer';
import { MockAstroLocals, makeRendererProps, parentSuiteName, sharedTags } from './test-utils';

const localSuiteName = 'Virtual Components Container tests';

describe(parentSuiteName, () => {
	[
		{
			component: CustomImage,
			name: 'CustomImage',
			opts: {
				props: { src: 'https://seccdn.libravatar.org/static/img/mm/80.png', alt: 'Test Image' },
			},
		},
		{
			component: FormattedDate,
			name: 'FormattedDate',
			opts: { props: { date: new Date('2020-01-01'), __test_mode: true } },
		},
		{
			component: Generator,
			name: 'Generator',
			opts: { props: { locals: MockAstroLocals() } },
		},
		{
			component: Renderer,
			name: 'Renderer',
			opts: {
				props: makeRendererProps(
					'<div>This is a test content from the defaultContent field.</div>'
				),
			},
		},
		{
			component: Renderer,
			name: 'Renderer (no content)',
			opts: {
				props: makeRendererProps(null),
			},
		},
	].forEach(({ component, name, opts }) => {
		const testName = `${localSuiteName} - ${name} component`;
		const tags = [...sharedTags, 'component:virtuals', `component:${name}`];

		test(testName, async ({ renderComponent }) => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite('Virtual Components Container tests');
			await allure.subSuite(testName);
			await allure.tags(...tags);

			await allure.parameter('component', name);

			await allure.step(`Rendering ${name} component`, async (ctx) => {
				await ctx.parameter('props', JSON.stringify(opts.props, null, 2));

				const result = await renderComponent(component, name, opts);
				expect(result).toMatchSnapshot();
			});
		});
	});
});
