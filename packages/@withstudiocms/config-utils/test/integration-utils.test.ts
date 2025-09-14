import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { type DevServer, type Fixture, loadFixture, MockFunction } from './test-utils.js';

describe('Config Utils Integration Utility tests', () => {
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
			expect(json).toEqual({ bar: 42, foo: 'hello world' });
		});
	});

	describe('the file watcher reports that its watching the config file', () => {
		let res: Response;

		beforeAll(async () => {
			res = await fixture.fetch('/file-watcher', {
				method: 'GET',
			});
		});

		it('the endpoint responds with 200', () => {
			expect(res.status).toBe(200);
		});

		it('the endpoint responds with the expected initial reports', async () => {
			const json = (await res.json()) as { logs: string[]; errors: string[] };
			expect(json.logs).toHaveLength(1);
			expect(json.logs[0]).toContain('example.config.mjs');
			expect(json.errors).toHaveLength(0);
		});
	});
});
