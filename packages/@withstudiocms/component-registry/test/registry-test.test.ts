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

			const entry = json.find((entry: { name: string }) => entry.name === 'test-comp');

			expect(entry).toBeDefined();

			expect(entry.name).toBe('test-comp');
			expect(entry.safeName).toBe('test_comp');

			expect(entry.props).toBeDefined();
			expect(entry.props.length).toBe(3);

			expect(entry.props[0].name).toBe('foo');
			expect(entry.props[0].type).toBe('string');
			expect(entry.props[0].optional).toBe(false);
			expect(entry.props[0].description).toBe('A string property.');
			expect(entry.props[0].defaultValue).toBe('Hello World');
			expect(entry.props[0].jsDocTags).toBeDefined();
			expect(entry.props[0].jsDocTags.length).toBe(1);
			expect(entry.props[0].jsDocTags[0].tagName).toBe('default');
			expect(entry.props[0].jsDocTags[0].text).toBe('Hello World');

			expect(entry.props[1].name).toBe('bar');
			expect(entry.props[1].type).toBe('number');
			expect(entry.props[1].optional).toBe(false);
			expect(entry.props[1].description).toBe('A number property.');
			expect(entry.props[1].defaultValue).toBe('42');
			expect(entry.props[1].jsDocTags).toBeDefined();
			expect(entry.props[1].jsDocTags.length).toBe(1);
			expect(entry.props[1].jsDocTags[0].tagName).toBe('default');
			expect(entry.props[1].jsDocTags[0].text).toBe('42');

			expect(entry.props[2].name).toBe('baz');
			expect(entry.props[2].type).toBe('`${string}-${string}-${string}.${number}`');
			expect(entry.props[2].optional).toBe(false);
			expect(entry.props[2].description).toBe('Example Template literal');
			expect(entry.props[2].defaultValue).toBe('foo-bar-baz.42');
			expect(entry.props[2].jsDocTags).toBeDefined();
			expect(entry.props[2].jsDocTags.length).toBe(1);
			expect(entry.props[2].jsDocTags[0].tagName).toBe('default');
			expect(entry.props[2].jsDocTags[0].text).toBe('foo-bar-baz.42');
		});
	});
});
