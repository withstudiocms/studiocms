import fs from 'node:fs';
import * as allure from 'allure-js-commons';
import { describe, expect, test } from 'vitest';
import { loadConfigFile } from '../src/loader.js';
import { parentSuiteName, sharedTags } from './test-utils.js';

const localSuiteName = 'Config loader Tests';

const exampleConfig = {
	name: 'Example Config',
	description: 'This is an example config file for testing purposes.',
	foo: 'bar',
	verbose: true,
	integer: 42,
};

const configPaths = ['example.config.js', 'example.config.ts'];

describe(parentSuiteName, () => {
	const fixtureTests = [
		{
			rootUrl: new URL('./fixtures/loader-js/', import.meta.url),
			name: 'loader-js',
		},
		{
			rootUrl: new URL('./fixtures/loader-ts/', import.meta.url),
			name: 'loader-ts',
		},
	];

	function loadConfig(root: URL) {
		return loadConfigFile({ configPaths, fs, root });
	}

	fixtureTests.forEach(({ rootUrl, name }) => {
		test(`Should load config from ${name}`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite(`Load Config - ${name}`);
			await allure.tags(...sharedTags);

			await allure.step(`Loading config from ${name}`, async (ctx) => {
				ctx.parameter('rootUrl', rootUrl.toString());
				const config = await loadConfig(rootUrl);
				ctx.parameter('loadedConfig', JSON.stringify(config, null, 2));
				expect(config).toEqual(exampleConfig);
			});
		});
	});

	test('Should return {} when no candidate file exists in root', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('Load Config - loader-neither');
		await allure.tags(...sharedTags);

		const rootUrl = new URL('./fixtures/loader-neither/', import.meta.url);
		await allure.step('Loading config from loader-neither (no candidates present)', async (ctx) => {
			ctx.parameter('rootUrl', rootUrl.toString());
			const config = await loadConfig(rootUrl);
			ctx.parameter('loadedConfig', JSON.stringify(config, null, 2));
			expect(config).toEqual({});
		});
	});

	test('Should prefer first configPaths entry (.js) when both candidates exist', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('Load Config - loader-both');
		await allure.tags(...sharedTags);

		const rootUrl = new URL('./fixtures/loader-both/', import.meta.url);
		await allure.step('Loading config from loader-both (both .js and .ts present)', async (ctx) => {
			ctx.parameter('rootUrl', rootUrl.toString());
			const config = await loadConfig(rootUrl);
			ctx.parameter('loadedConfig', JSON.stringify(config, null, 2));
			// configPaths = ['example.config.js', 'example.config.ts']
			// .js is listed first so the loader must break on it and never reach .ts
			expect(config).toHaveProperty('source', 'js');
		});
	});
});
