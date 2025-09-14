/** biome-ignore-all lint/suspicious/noTemplateCurlyInString: this is fine */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { type DevServer, type Fixture, loadFixture, MockFunction } from './test-utils.js';

describe('Component Registry Integration tests', () => {
	let fixture: Fixture;
	let devServer: DevServer;
	let consoleErrorMock: MockFunction<Console, 'error'>;

	beforeAll(async () => {
		consoleErrorMock = new MockFunction(console, 'error');
		fixture = await loadFixture({ root: './fixtures/registry-test/' });
		devServer = await fixture.startDevServer({});
	});

	afterAll(async () => {
		consoleErrorMock.restore();
		await devServer.stop();
	});

	beforeEach(() => {
		consoleErrorMock.reset();
	});

	describe('the integration loads and serves basic config over endpoint', () => {
		let res: Response;

		beforeAll(async () => {
			res = await fixture.fetch('/', {
				method: 'GET',
			});
		});

		it('the endpoint responds with 200', () => {
			expect(res.status).toBe(200);
		});

		it('the endpoint responds with the expected config', async () => {
			const json = await res.json();

			expect(json).toEqual([
				{
					name: 'test-comp',
					props: [
						{
							name: 'foo',
							type: 'string',
							optional: false,
							description: 'A string property.',
							defaultValue: 'Hello World',
							jsDocTags: [
								{
									tagName: 'default',
									text: 'Hello World',
								},
							],
						},
						{
							name: 'bar',
							type: 'number',
							optional: false,
							description: 'A number property.',
							defaultValue: '42',
							jsDocTags: [
								{
									tagName: 'default',
									text: '42',
								},
							],
						},
						{
							name: 'baz',
							type: '`${string}-${string}-${string}.${number}`',
							optional: false,
							description: 'Example Template literal',
							defaultValue: 'foo-bar-baz.42',
							jsDocTags: [
								{
									tagName: 'default',
									text: 'foo-bar-baz.42',
								},
							],
						},
					],
					safeName: 'test_comp',
				},
			]);
		});
	});
});
