/// <reference types="astro/client" />
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { beforeAll, describe, expect, test } from 'vitest';
import FallbackCanvas from '../../src/components/auth/FallbackCanvas.astro';
import OAuthButton from '../../src/components/auth/OAuthButton.astro';
import OAuthButtonStack from '../../src/components/auth/OAuthButtonStack.astro';
import StaticAuthCheck from '../../src/components/auth/StaticAuthCheck.astro';
import StudioCMSLogoSVG from '../../src/components/auth/StudioCMSLogoSVG.astro';
import ThreeCanvasLoader from '../../src/components/auth/ThreeCanvasLoader.astro';
import PageHeader from '../../src/components/first-time-setup/PageHeader.astro';
import Code from '../../src/components/shared/Code.astro';
import Favicons from '../../src/components/shared/head/Favicons.astro';
import Global from '../../src/components/shared/head/Global.astro';
import TitleTags from '../../src/components/shared/head/TitleTags.astro';
import SSRUser from '../../src/components/shared/SSRUser.astro';
import ThemeManager from '../../src/components/shared/ThemeManager.astro';
import { cleanAstroAttributes, MockAstroLocals } from '../test-utils';

describe('Components Container tests', () => {
	let container: AstroContainer;

	beforeAll(async () => {
		container = await AstroContainer.create();
	});

	describe('Shared components', () => {
		describe('TitleTags', () => {
			test('render component', async () => {
				const result = await container.renderToString(TitleTags, {
					locals: MockAstroLocals(),
					props: { title: 'Test Title', description: 'Test Description' },
				});
				const cleanResult = cleanAstroAttributes(result, '/mock/path/TitleTags.astro');
				expect(cleanResult).toMatchSnapshot();
			});
		});

		describe('ThemeManager component', () => {
			test('render component', async () => {
				const result = await container.renderToString(ThemeManager, { locals: MockAstroLocals() });
				const cleanResult = cleanAstroAttributes(result, '/mock/path/ThemeManager.astro');
				expect(cleanResult).toMatchSnapshot();
			});
		});

		describe('SSRUser component', () => {
			test('render component', async () => {
				const result = await container.renderToString(SSRUser, {
					locals: MockAstroLocals(),
					props: { name: 'mock', description: 'mock-admin' },
				});
				const cleanResult = cleanAstroAttributes(result, '/mock/path/SSRUser.astro');
				expect(cleanResult).toMatchSnapshot();
			});
		});

		describe('Global component', () => {
			test('render component', async () => {
				const result = await container.renderToString(Global, {
					locals: MockAstroLocals(),
				});
				const cleanResult = cleanAstroAttributes(result, '/mock/path/Global.astro');
				expect(cleanResult).toMatchSnapshot();
			});
		});

		describe('Favicons component', () => {
			test('render component', async () => {
				const result = await container.renderToString(Favicons, {
					locals: MockAstroLocals(),
				});
				const cleanResult = cleanAstroAttributes(result, '/mock/path/Favicons.astro');
				expect(cleanResult).toMatchSnapshot();
			});
		});

		describe('Code component', () => {
			test('render component', async () => {
				const result = await container.renderToString(Code, {
					locals: MockAstroLocals(),
					props: { code: 'export const hello = "hello world!";', __test_mode: true },
				});
				const cleanResult = cleanAstroAttributes(result, '/mock/path/Code.astro');
				expect(cleanResult).toMatchSnapshot();
			});
		});
	});

	describe('First Time Setup components', () => {
		describe('PageHeader component', () => {
			test('render component', async () => {
				const result = await container.renderToString(PageHeader, {
					locals: MockAstroLocals(),
					props: { title: 'Test Page' },
				});
				const cleanResult = cleanAstroAttributes(result, '/mock/path/PageHeader.astro');
				expect(cleanResult).toMatchSnapshot();
			});
			test('render component with badge', async () => {
				const result = await container.renderToString(PageHeader, {
					locals: MockAstroLocals(),
					props: { title: 'Test Page', badge: { label: 'New' } },
				});
				const cleanResult = cleanAstroAttributes(result, '/mock/path/PageHeader.astro');
				expect(cleanResult).toMatchSnapshot();
			});
			test('render component with badge and icon', async () => {
				const result = await container.renderToString(PageHeader, {
					locals: MockAstroLocals(),
					props: { title: 'Test Page', badge: { label: 'New', icon: 'heroicons:academic-cap' } },
				});
				const cleanResult = cleanAstroAttributes(result, '/mock/path/PageHeader.astro');
				expect(cleanResult).toMatchSnapshot();
			});
		});
	});

	describe('Auth components', () => {
		describe('ThreeCanvasLoader component', () => {
			test('render component', async () => {
				const result = await container.renderToString(ThreeCanvasLoader, {
					locals: MockAstroLocals(),
				});
				const cleanResult = cleanAstroAttributes(result, '/mock/path/ThreeCanvasLoader.astro');
				expect(cleanResult).toMatchSnapshot();
			});
		});

		describe('StudioCMSLogoSVG component', () => {
			test('render component', async () => {
				const result = await container.renderToString(StudioCMSLogoSVG);
				const cleanResult = cleanAstroAttributes(result, '/mock/path/StudioCMSLogoSVG.astro');
				expect(cleanResult).toMatchSnapshot();
			});
		});

		describe('StaticAuthCheck component', () => {
			test('render component no props', async () => {
				const result = await container.renderToString(StaticAuthCheck, {
					locals: MockAstroLocals(),
				});
				const cleanResult = cleanAstroAttributes(result, '/mock/path/StaticAuthCheck.astro');
				expect(cleanResult).toMatchSnapshot();
			});
			test('render component with props', async () => {
				const result = await container.renderToString(StaticAuthCheck, {
					locals: MockAstroLocals(),
					props: { userData: { isLoggedIn: true } },
				});
				const cleanResult = cleanAstroAttributes(result, '/mock/path/StaticAuthCheck.astro');
				expect(cleanResult).toMatchSnapshot();
			});
		});

		describe('OAuthButtonStack component', () => {
			test('render component', async () => {
				const result = await container.renderToString(OAuthButtonStack, {
					locals: MockAstroLocals(),
				});
				const cleanResult = cleanAstroAttributes(result, '/mock/path/OAuthButtonStack.astro');
				expect(cleanResult).toMatchSnapshot();
			});
		});

		describe('OAuthButton component', () => {
			test('render component', async () => {
				const result = await container.renderToString(OAuthButton, {
					locals: MockAstroLocals(),
					props: {
						label: 'test auth',
						href: '/test/endpoint',
						image: '<img src="/fake/image.jpg">',
					},
				});
				const cleanResult = cleanAstroAttributes(result, '/mock/path/OAuthButton.astro');
				expect(cleanResult).toMatchSnapshot();
			});
		});

		describe('FallbackCanvas component', () => {
			test('render component', async () => {
				const result = await container.renderToString(FallbackCanvas, {
					locals: MockAstroLocals(),
				});
				const cleanResult = cleanAstroAttributes(result, '/mock/path/FallbackCanvas.astro');
				expect(cleanResult).toMatchSnapshot();
			});
		});
	});
});
