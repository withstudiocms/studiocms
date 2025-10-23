import * as allure from 'allure-js-commons';
import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'vitest';
import {
	type DevServer,
	type Fixture,
	loadFixture,
	MockFunction,
	parentSuiteName,
	sharedTags,
} from './test-utils.js';

const localSuiteName = 'Integration Tests';

describe(parentSuiteName, () => {
	let fixture: Fixture;
	let devServer: DevServer;
	let consoleErrorMock: MockFunction<Console, 'error'>;

	beforeAll(async () => {
		consoleErrorMock = new MockFunction(console, 'error');
		fixture = await loadFixture({ root: './fixtures/integration-utils/' });
		devServer = await fixture.startDevServer({});
	});

	afterAll(async () => {
		consoleErrorMock.restore();
		await devServer.stop();
	});

	beforeEach(() => {
		consoleErrorMock.reset();
	});

	[
		{
			endpoint: '/',
			expectedStatus: 200,
			data: { bar: 42, foo: 'hello world' },
		},
		{
			endpoint: '/file-watcher',
			expectedStatus: 200,
			data: {
				logs: ['example.config.mjs'],
				errors: [],
			},
		},
	].forEach(({ endpoint, expectedStatus, data }) => {
		test(`Integration Utils - Endpoint ${endpoint} responds correctly`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('Endpoint Tests');
			await allure.tags(...sharedTags);

			await allure.parameter('endpoint', endpoint);
			await allure.parameter('expectedStatus', String(expectedStatus));
			await allure.parameter('expectedData', JSON.stringify(data));

			const res = await fixture.fetch(endpoint, {
				method: 'GET',
			});

			await allure.step(`Should respond with status ${expectedStatus}`, async (ctx) => {
				ctx.parameter('actualStatus', String(res.status));
				expect(res.status).toBe(expectedStatus);
			});

			await allure.step('Should respond with expected data', async (ctx) => {
				const json = await res.json();
				ctx.parameter('actualData', JSON.stringify(json));
				if (endpoint === '/') {
					expect(json).toEqual(data);
				} else if (endpoint === '/file-watcher') {
					expect(json.logs).toHaveLength(1);
					expect(json.logs[0]).toContain('example.config.mjs');
					expect(json.errors).toEqual(data.errors);
				}
			});
		});
	});
});
