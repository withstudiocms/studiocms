/// <reference types="astro/client" />
import { describe, expect } from 'vitest';
import FallbackCanvas from '../src/components/auth/FallbackCanvas.astro';
import OAuthButton from '../src/components/auth/OAuthButton.astro';
import OAuthButtonStack from '../src/components/auth/OAuthButtonStack.astro';
import StaticAuthCheck from '../src/components/auth/StaticAuthCheck.astro';
import StudioCMSLogoSVG from '../src/components/auth/StudioCMSLogoSVG.astro';
import ThreeCanvasLoader from '../src/components/auth/ThreeCanvasLoader.astro';
import PageHeader from '../src/components/first-time-setup/PageHeader.astro';
import Code from '../src/components/shared/Code.astro';
import Favicons from '../src/components/shared/head/Favicons.astro';
import Global from '../src/components/shared/head/Global.astro';
import TitleTags from '../src/components/shared/head/TitleTags.astro';
import SSRUser from '../src/components/shared/SSRUser.astro';
import ThemeManager from '../src/components/shared/ThemeManager.astro';
import { test } from './fixtures/AstroContainer';

describe('Components Container tests', () => {
	describe('Shared components', () => {
		describe('TitleTags', () => {
			test('render component', async ({ renderComponent }) => {
				const result = await renderComponent(TitleTags, 'TitleTags', {
					props: { title: 'Test Title', description: 'Test Description' },
				});
				expect(result).toMatchSnapshot();
			});
		});

		describe('ThemeManager component', () => {
			test('render component', async ({ renderComponent }) => {
				const result = await renderComponent(ThemeManager, 'ThemeManager');
				expect(result).toMatchSnapshot();
			});
		});

		describe('SSRUser component', () => {
			test('render component', async ({ renderComponent }) => {
				const result = await renderComponent(SSRUser, 'SSRUser', {
					props: { name: 'mock', description: 'mock-admin' },
				});
				expect(result).toMatchSnapshot();
			});

			test('render component without avatar', async ({ renderComponent }) => {
				const result = await renderComponent(SSRUser, 'SSRUser', {
					props: {
						name: 'John Doe',
						description: 'Software Engineer',
						id: 'test-user-1',
					},
				});
				expect(result).toContain('<svg');
				expect(result).toContain('Placeholder avatar for John Doe');
				expect(result).not.toContain('studiocms-avatar');

				expect(result).toMatchSnapshot();
			});

			test('render component with avatar URL', async ({ renderComponent }) => {
				const result = await renderComponent(SSRUser, 'SSRUser', {
					props: {
						name: 'Jane Doe',
						description: 'Designer',
						avatar: 'https://example.com/avatar.jpg',
						id: 'test-user-2',
					},
				});
				expect(result).toContain('studiocms-avatar');
				expect(result).toContain('data-avatar-url="https://example.com/avatar.jpg"');
				expect(result).toContain('data-avatar-fallback');
				expect(result).toContain('data-avatar-name="Jane Doe"');

				expect(result).toMatchSnapshot();
			});

			test('render component with avatar fallback image', async ({ renderComponent }) => {
				const result = await renderComponent(SSRUser, 'SSRUser', {
					props: {
						name: 'Bob Smith',
						description: 'Developer',
						avatar: 'https://example.com/avatar.jpg',
						id: 'test-user-3',
					},
				});
				expect(result).toContain('src="data:image/png;base64');
				expect(result).toContain('sui-avatar-img');

				expect(result).toMatchSnapshot();
			});
		});

		describe('Global component', () => {
			test('render component', async ({ renderComponent }) => {
				const result = await renderComponent(Global, 'Global');
				expect(result).toMatchSnapshot();
			});
		});

		describe('Favicons component', () => {
			test('render component', async ({ renderComponent }) => {
				const result = await renderComponent(Favicons, 'Favicons');
				expect(result).toMatchSnapshot();
			});
		});

		describe('Code component', () => {
			test('render component', async ({ renderComponent }) => {
				const result = await renderComponent(Code, 'Code', {
					props: { code: 'export const hello = "hello world!";', __test_mode: true },
				});
				expect(result).toMatchSnapshot();
			});
		});
	});

	describe('First Time Setup components', () => {
		describe('PageHeader component', () => {
			test('render component', async ({ renderComponent }) => {
				const result = await renderComponent(PageHeader, 'PageHeader', {
					props: { title: 'Test Page' },
				});
				expect(result).toMatchSnapshot();
			});
			test('render component with badge', async ({ renderComponent }) => {
				const result = await renderComponent(PageHeader, 'PageHeader', {
					props: { title: 'Test Page', badge: { label: 'New' } },
				});
				expect(result).toMatchSnapshot();
			});
			test('render component with badge and icon', async ({ renderComponent }) => {
				const result = await renderComponent(PageHeader, 'PageHeader', {
					props: { title: 'Test Page', badge: { label: 'New', icon: 'heroicons:academic-cap' } },
				});
				expect(result).toMatchSnapshot();
			});
		});
	});

	describe('Auth components', () => {
		describe('ThreeCanvasLoader component', () => {
			test('render component', async ({ renderComponent }) => {
				const result = await renderComponent(ThreeCanvasLoader, 'ThreeCanvasLoader');
				expect(result).toMatchSnapshot();
			});
		});

		describe('StudioCMSLogoSVG component', () => {
			test('render component', async ({ renderComponent }) => {
				const result = await renderComponent(StudioCMSLogoSVG, 'StudioCMSLogoSVG');
				expect(result).toMatchSnapshot();
			});
		});

		describe('StaticAuthCheck component', () => {
			test('render component no props', async ({ renderComponent }) => {
				const result = await renderComponent(StaticAuthCheck, 'StaticAuthCheck');
				expect(result).toMatchSnapshot();
			});
			test('render component with props', async ({ renderComponent }) => {
				const result = await renderComponent(StaticAuthCheck, 'StaticAuthCheck', {
					props: { userData: { isLoggedIn: true } },
				});
				expect(result).toMatchSnapshot();
			});
		});

		describe('OAuthButtonStack component', () => {
			test('render component', async ({ renderComponent }) => {
				const result = await renderComponent(OAuthButtonStack, 'OAuthButtonStack');
				expect(result).toMatchSnapshot();
			});
		});

		describe('OAuthButton component', () => {
			test('render component', async ({ renderComponent }) => {
				const result = await renderComponent(OAuthButton, 'OAuthButton', {
					props: {
						label: 'test auth',
						href: '/test/endpoint',
						image: '<img src="/fake/image.jpg">',
					},
				});
				expect(result).toMatchSnapshot();
			});
		});

		describe('FallbackCanvas component', () => {
			test('render component', async ({ renderComponent }) => {
				const result = await renderComponent(FallbackCanvas, 'FallbackCanvas');
				expect(result).toMatchSnapshot();
			});
		});
	});
});
