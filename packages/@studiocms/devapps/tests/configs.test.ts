import { describe, expect, it, test } from '@effect/vitest';
import * as allure from 'allure-js-commons';
import type { APIContext } from 'astro';
import { Effect } from 'studiocms/effect';
import {
	APIEndpointConfig,
	AstroAPIContextProvider,
	CategoryOrTagConfig,
	DownloadImageConfig,
	DownloadPostImageConfig,
	FullPageData,
	ImportEndpointConfig,
	ImportPostsEndpointConfig,
	RawPageData,
	StringConfig,
	UseBlogPkgConfig,
} from '../src/effects/WordPressAPI/configs';
import type { PageData } from '../src/effects/WordPressAPI/importers';
import { parentSuiteName, sharedTags } from './test-utils.js';

const localSuiteName = 'WordPress API Config Tests';

describe(parentSuiteName, () => {
	test('StringConfig - should create config with correct structure', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('StringConfig Tests');
		await allure.tags(...sharedTags);

		await allure.step('Should create StringConfig with correct structure', async (ctx) => {
			const str = 'test-string';
			const config = StringConfig.of({ str });

			await ctx.parameter('config', JSON.stringify(config, null, 2));

			expect(config.str).toBe(str);
			expect(config).toHaveProperty('str', str);
		});
	});

	it.effect('StringConfig - should create layer with makeLayer', () =>
		Effect.gen(function* () {
			yield* Effect.tryPromise(async () => {
				await allure.parentSuite(parentSuiteName);
				await allure.suite(localSuiteName);
				await allure.subSuite('StringConfig Tests');
				await allure.tags(...sharedTags);
			});

			const str = 'test-string';
			const layer = StringConfig.makeLayer(str);

			yield* Effect.tryPromise(async () => {
				await allure.parameter('str', str);
				await allure.parameter('layer', JSON.stringify(layer, null, 2));
			});

			// Test that the layer can be used to provide the config
			const config = yield* StringConfig;
			expect(config.str).toBe(str);
		}).pipe(Effect.provide(StringConfig.makeLayer('test-string')))
	);

	[
		{
			endpoint: 'https://example.com/wp-json/wp/v2',
			type: 'posts' as const,
			path: '/posts',
		},
		{
			endpoint: 'https://example.com/wp-json/wp/v2',
			type: 'posts' as const,
		},
		{
			endpoint: 'https://example.com/wp-json/wp/v2',
			type: 'pages' as const,
		},
	].forEach(({ endpoint, type, path }) => {
		test(`APIEndpointConfig - should create config for type: ${type}`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('APIEndpointConfig Tests');
			await allure.tags(...sharedTags);

			await allure.step(`Should create APIEndpointConfig for type: ${type}`, async (ctx) => {
				const config = APIEndpointConfig.of({ endpoint, type, path });

				await ctx.parameter('config', JSON.stringify(config, null, 2));

				expect(config.endpoint).toBe(endpoint);
				expect(config.type).toBe(type);
				if (path) {
					expect(config.path).toBe(path);
				} else {
					expect(config.path).toBeUndefined();
				}
			});
		});
	});

	[
		{
			imageUrl: 'https://example.com/image.jpg',
			destination: '/public/images/image.jpg',
		},
		{
			imageUrl: new URL('https://example.com/image.jpg'),
			destination: new URL('file:///public/images/image.jpg'),
		},
	].forEach(({ imageUrl, destination }) => {
		test(`DownloadImageConfig - should create config with imageUrl: ${imageUrl.toString()}`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('DownloadImageConfig Tests');
			await allure.tags(...sharedTags);

			await allure.step(
				`Should create DownloadImageConfig with imageUrl: ${imageUrl.toString()}`,
				async (ctx) => {
					const config = DownloadImageConfig.of({ imageUrl, destination });

					await ctx.parameter('config', JSON.stringify(config, null, 2));

					expect(config.imageUrl).toBe(imageUrl);
					expect(config.destination).toBe(destination);
				}
			);
		});
	});

	test('DownloadPostImageConfig - should create config with correct structure', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('DownloadPostImageConfig Tests');
		await allure.tags(...sharedTags);

		await allure.step(
			'Should create DownloadPostImageConfig with correct structure',
			async (ctx) => {
				const str = 'image-content';
				const pathToFolder = '/public/images';
				const config = DownloadPostImageConfig.of({ str, pathToFolder });

				await ctx.parameter('config', JSON.stringify(config, null, 2));

				expect(config.str).toBe(str);
				expect(config.pathToFolder).toBe(pathToFolder);
			}
		);
	});

	test('ImageEndpointConfig - should validate all required fields are present', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('ImageEndpointConfig Tests');
		await allure.tags(...sharedTags);

		await allure.step('should create config', async (ctx) => {
			const endpoint = 'https://example.com/wp-json/wp/v2';
			const config = ImportEndpointConfig.of({ endpoint });

			await ctx.parameter('config', JSON.stringify(config, null, 2));

			expect(config.endpoint).toBe(endpoint);
		});
	});

	[
		{
			endpoint: 'https://example.com/wp-json/wp/v2',
			useBlogPkg: false,
		},
		{
			endpoint: 'https://example.com/wp-json/wp/v2',
			useBlogPkg: true,
		},
	].forEach(({ endpoint, useBlogPkg }) => {
		test(`ImportPostsEndpointConfig - should create config with useBlogPkg: ${useBlogPkg}`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('ImportPostsEndpointConfig Tests');
			await allure.tags(...sharedTags);

			await allure.step(
				`Should create ImportPostsEndpointConfig with useBlogPkg: ${useBlogPkg}`,
				async (ctx) => {
					const config = ImportPostsEndpointConfig.of({ endpoint, useBlogPkg });

					await ctx.parameter('config', JSON.stringify(config, null, 2));

					expect(config.endpoint).toBe(endpoint);
					expect(config.useBlogPkg).toBe(useBlogPkg);
				}
			);
		});
	});

	test('AstroAPIContextProvider - should create config with correct structure', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('AstroAPIContextProvider Tests');
		await allure.tags(...sharedTags);

		await allure.step(
			'Should create AstroAPIContextProvider with correct structure',
			async (ctx) => {
				const context = {
					request: new Request('https://example.com'),
					params: {},
					props: {},
				} as APIContext;
				const config = AstroAPIContextProvider.of({ context });

				await ctx.parameter('config', JSON.stringify(config, null, 2));

				expect(config.context).toBe(context);
			}
		);
	});

	test('RawPageData - should validate all required fields are present', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('RawPageData Tests');
		await allure.tags(...sharedTags);

		await allure.step('should create config', async (ctx) => {
			const page = { id: 1, title: 'Test Page' };
			const config = RawPageData.of({ page });

			await ctx.parameter('config', JSON.stringify(config, null, 2));

			expect(config.page).toBe(page);
		});
	});

	test('FullPageData - should validate all required fields are present', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('FullPageData Tests');
		await allure.tags(...sharedTags);

		await allure.step('should create config', async (ctx) => {
			const pageData = {
				id: '1',
				title: 'Test Page',
				description: 'A test page',
				content: 'Test content',
				slug: 'test-page',
			} as unknown as PageData;
			const config = FullPageData.of({ pageData });

			await ctx.parameter('config', JSON.stringify(config, null, 2));

			expect(config.pageData).toBe(pageData);
		});
	});

	[
		{
			useBlogPkg: false,
		},
		{
			useBlogPkg: true,
		},
	].forEach(({ useBlogPkg }) => {
		test(`UseBlogPkgConfig - should create config with useBlogPkg: ${useBlogPkg}`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('UseBlogPkgConfig Tests');
			await allure.tags(...sharedTags);

			await allure.step(
				`Should create UseBlogPkgConfig with useBlogPkg: ${useBlogPkg}`,
				async (ctx) => {
					const config = UseBlogPkgConfig.of({ useBlogPkg });

					await ctx.parameter('config', JSON.stringify(config, null, 2));

					expect(config.useBlogPkg).toBe(useBlogPkg);
				}
			);
		});
	});

	[[1, 2, 3], []].forEach((value) => {
		test(`CategoryOrTagConfig - should create config with value: [${value.join(', ')}]`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('CategoryOrTagConfig Tests');
			await allure.tags(...sharedTags);

			await allure.step(
				`Should create CategoryOrTagConfig with value: [${value.join(', ')}]`,
				async (ctx) => {
					const config = CategoryOrTagConfig.of({ value });

					await ctx.parameter('config', JSON.stringify(config, null, 2));

					expect(config.value).toEqual(value);
				}
			);
		});
	});

	[
		{
			label: 'StringConfig',
			config: StringConfig.of({ str: 'test' }),
		},
		{
			label: 'APIEndpointConfig',
			config: APIEndpointConfig.of({ endpoint: 'https://example.com', type: 'posts' as const }),
		},
		{
			label: 'DownloadImageConfig',
			config: DownloadImageConfig.of({
				imageUrl: 'https://example.com/image.jpg',
				destination: '/public/images',
			}),
		},
		{
			label: 'DownloadPostImageConfig',
			config: DownloadPostImageConfig.of({ str: 'content', pathToFolder: '/public' }),
		},
		{
			label: 'ImportEndpointConfig',
			config: ImportEndpointConfig.of({ endpoint: 'https://example.com' }),
		},
		{
			label: 'ImportPostsEndpointConfig',
			config: ImportPostsEndpointConfig.of({ endpoint: 'https://example.com', useBlogPkg: false }),
		},
		{
			label: 'AstroAPIContextProvider',
			config: AstroAPIContextProvider.of({ context: {} as APIContext }),
		},
		{
			label: 'RawPageData',
			config: RawPageData.of({ page: {} }),
		},
		{
			label: 'FullPageData',
			config: FullPageData.of({ pageData: {} as PageData }),
		},
		{
			label: 'UseBlogPkgConfig',
			config: UseBlogPkgConfig.of({ useBlogPkg: false }),
		},
		{
			label: 'CategoryOrTagConfig',
			config: CategoryOrTagConfig.of({ value: [] as const }),
		},
	].forEach(({ label, config }) => {
		test(`${label} - should ensure config is defined`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('Configuration Validation Tests');
			await allure.tags(...sharedTags);

			await allure.step(`Should ensure ${label} is defined`, async (ctx) => {
				await ctx.parameter('config', JSON.stringify(config, null, 2));

				expect(config).toBeDefined();
				expect(typeof config).toBe('object');
			});
		});
	});
});
