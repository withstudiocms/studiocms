/// <reference types="astro/client" />
import { describe, expect } from 'vitest';
import CustomImage from '../src/virtuals/components/CustomImage.astro';
import FormattedDate from '../src/virtuals/components/FormattedDate.astro';
import Generator from '../src/virtuals/components/Generator.astro';
import Renderer from '../src/virtuals/components/Renderer.astro';
import { allureTester } from './fixtures/allureTester';
import { MockAstroLocals, makeRendererProps, parentSuiteName, sharedTags } from './test-utils';

const localSuiteName = 'Virtual Components Container tests';

describe(parentSuiteName, () => {
	[
		{
			component: CustomImage,
			name: 'CustomImage',
			opts: {
				props: { src: 'https://cdn.studiocms.dev/default_avatar.png', alt: 'Test Image' },
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
				await ctx.parameter('props', JSON.stringify(opts.props, null, 2));

				const result = await renderComponent(component, name, opts);
				expect(result).toMatchSnapshot();
			});
		});
	});
});
