/// <reference types="astro/client" />
import { describe, expect } from 'vitest';
import FallbackCanvas from '../src/frontend/components/auth/FallbackCanvas.astro';
import OAuthButton from '../src/frontend/components/auth/OAuthButton.astro';
import OAuthButtonStack from '../src/frontend/components/auth/OAuthButtonStack.astro';
import StaticAuthCheck from '../src/frontend/components/auth/StaticAuthCheck.astro';
import StudioCMSLogoSVG from '../src/frontend/components/auth/StudioCMSLogoSVG.astro';
import ThreeCanvasLoader from '../src/frontend/components/auth/ThreeCanvasLoader.astro';
import PageHeader from '../src/frontend/components/first-time-setup/PageHeader.astro';
import Code from '../src/frontend/components/shared/Code.astro';
import SSRUser from '../src/frontend/components/shared/SSRUser.astro';
import ThemeManager from '../src/frontend/components/shared/ThemeManager.astro';
import { allureTester } from './fixtures/allureTester';
import { parentSuiteName, sharedTags } from './test-utils';

const localSuiteName = 'Components Container tests';

describe(parentSuiteName, () => {
	[
		{
			component: ThemeManager,
			name: 'ThemeManager',
			opts: {},
		},
		{
			component: SSRUser,
			name: 'SSRUser',
			opts: { props: { name: 'mock', description: 'mock-admin' } },
		},
		{
			component: SSRUser,
			name: 'SSRUser',
			opts: {
				props: {
					name: 'John Doe',
					description: 'Software Engineer',
					id: 'test-user-1',
				},
			},
		},
		{
			component: SSRUser,
			name: 'SSRUser',
			opts: {
				props: {
					name: 'Jane Doe',
					description: 'Designer',
					avatar: 'https://example.com/avatar.jpg',
					id: 'test-user-2',
				},
			},
		},
		{
			component: SSRUser,
			name: 'SSRUser',
			opts: {
				props: {
					name: 'Bob Smith',
					description: 'Developer',
					avatar: 'https://example.com/avatar.jpg',
					id: 'test-user-3',
				},
			},
		},
		{
			component: Code,
			name: 'Code',
			opts: {
				props: { code: 'export const hello = "hello world!";', __test_mode: true },
			},
		},
		{
			component: PageHeader,
			name: 'PageHeader',
			opts: { props: { title: 'Test Page' } },
		},
		{
			component: PageHeader,
			name: 'PageHeader with badge',
			opts: { props: { title: 'Test Page', badge: { label: 'New' } } },
		},
		{
			component: PageHeader,
			name: 'PageHeader with badge and icon',
			opts: {
				props: {
					title: 'Test Page',
					badge: { label: 'New', icon: 'heroicons:academic-cap' },
				},
			},
		},
		{
			component: ThreeCanvasLoader,
			name: 'ThreeCanvasLoader',
			opts: {},
		},
		{
			component: StudioCMSLogoSVG,
			name: 'StudioCMSLogoSVG',
			opts: {},
		},
		{
			component: StaticAuthCheck,
			name: 'StaticAuthCheck',
			opts: {},
		},
		{
			component: OAuthButtonStack,
			name: 'OAuthButtonStack',
			opts: {},
		},
		{
			component: OAuthButton,
			name: 'OAuthButton',
			opts: {
				props: {
					label: 'test auth',
					href: '/test/endpoint',
					image: '<img src="/fake/image.jpg">',
				},
			},
		},
		{
			component: FallbackCanvas,
			name: 'FallbackCanvas',
			opts: {},
		},
	].forEach(({ component, name, opts }) => {
		const testName = `${localSuiteName} - ${name} component`;
		const tags = [...sharedTags, 'component:shared', `component:${name}`];

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
