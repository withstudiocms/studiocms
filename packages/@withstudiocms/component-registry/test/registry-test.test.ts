/** biome-ignore-all lint/suspicious/noTemplateCurlyInString: this is fine */

import * as allure from 'allure-js-commons';
import { describe, expect, test } from 'vitest';
import {
	type DevServer,
	type Fixture,
	loadFixture,
	parentSuiteName,
	sharedTags,
} from './test-utils.js';

const localSuiteName = 'Astro Integration Tests';

describe(parentSuiteName, () => {
	let fixture: Fixture;
	let devServer: DevServer | null = null;

	test('Launch dev server and verify config', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('Dev Server Tests');
		await allure.tags(...sharedTags);

		await allure.step('Load fixture', async () => {
			fixture = await loadFixture({ root: './fixtures/registry-test/' });
		});

		await allure.step('Start Dev Server', async (ctx) => {
			devServer = await fixture.startDevServer({});
			ctx.parameter('address', JSON.stringify(devServer.address));
		});

		let res: Response;

		await allure.step('Fetch component registry JSON', async () => {
			res = await fixture.fetch('/', {
				method: 'GET',
			});
		});

		await allure.step('Verify response status is 200', async (ctx) => {
			ctx.parameter('status', JSON.stringify(res.status));
			expect(res.status).toBe(200);
		});

		let json: any;

		await allure.step('Parse JSON response', async () => {
			json = await res.json();
		});

		let entry: any;

		await allure.step('Find component registry entry for "test-comp"', async (ctx) => {
			entry = json.find((entry: { name: string }) => entry.name === 'test-comp');
			ctx.parameter('entry', JSON.stringify(entry));
		});

		await allure.step('Verify component registry entry exists', async (ctx) => {
			expect(entry).toBeDefined();
			ctx.parameter('exists', JSON.stringify(!!entry));
		});

		await allure.step('Verify component registry entry details', async (ctx) => {
			expect(entry.name).toBe('test-comp');
			ctx.parameter('name', entry.name);
			expect(entry.safeName).toBe('test_comp');
			ctx.parameter('safeName', entry.safeName);

			expect(entry.props).toBeDefined();
			ctx.parameter('props', JSON.stringify(entry.props));
			expect(entry.props.length).toBe(3);

			expect(entry.props[0].name).toBe('foo');
			expect(entry.props[0].type).toBe('string');
			expect(entry.props[0].optional).toBe(false);
			expect(entry.props[0].description).toBe('A string property.');
			expect(entry.props[0].defaultValue).toBe('Hello World');

			expect(entry.props[1].name).toBe('bar');
			expect(entry.props[1].type).toBe('number');
			expect(entry.props[1].optional).toBe(false);
			expect(entry.props[1].description).toBe('A number property.');
			expect(entry.props[1].defaultValue).toBe('42');

			expect(entry.props[2].name).toBe('baz');
			expect(entry.props[2].type).toBe('`${string}-${string}-${string}.${number}`');
			expect(entry.props[2].optional).toBe(false);
			expect(entry.props[2].description).toBe('Example Template literal');
			expect(entry.props[2].defaultValue).toBe('foo-bar-baz.42');
		});

		await allure.step('Stop Dev Server', async () => {
			if (devServer) {
				await devServer.stop();
			}
		});
	});
});
