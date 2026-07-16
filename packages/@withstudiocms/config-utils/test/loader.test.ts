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
});
