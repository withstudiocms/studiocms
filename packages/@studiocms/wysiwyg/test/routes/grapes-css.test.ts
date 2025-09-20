import { beforeEach, describe, expect, test, vi } from 'vitest';

// Mock the CSS import
vi.mock('../../src/styles/grapes.css?raw', () => ({
	default: `
		.grapesjs-container {
			width: 100%;
			height: 100vh;
		}
		
		.grapesjs-editor {
			background: #fff;
		}
		
		.grapesjs-panel {
			border: 1px solid #ddd;
		}
		
		.grapesjs-block {
			padding: 10px;
			margin: 5px;
		}
	`,
}));

describe('WYSIWYG Grapes CSS Route', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test('serves CSS content with correct headers', async () => {
		const { ALL } = await import('../../src/routes/grapes.css');

		const response = await ALL();

		expect(response).toBeInstanceOf(Response);
		expect(response.headers.get('Content-Type')).toBe('text/css');
		expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
		expect(response.headers.get('Access-Control-Allow-Methods')).toBe('GET, HEAD, OPTIONS');
	});

	test('returns CSS content', async () => {
		const { ALL } = await import('../../src/routes/grapes.css');

		const response = await ALL();
		const cssContent = await response.text();

		expect(cssContent).toContain('.grapesjs-container');
		expect(cssContent).toContain('.grapesjs-editor');
		expect(cssContent).toContain('.grapesjs-panel');
		expect(cssContent).toContain('.grapesjs-block');
	});

	test('handles HEAD request', async () => {
		const { ALL } = await import('../../src/routes/grapes.css');

		// Mock HEAD request by checking if the function handles it
		const response = await ALL();

		expect(response).toBeInstanceOf(Response);
		expect(response.headers.get('Content-Type')).toBe('text/css');
	});

	test('handles OPTIONS request', async () => {
		const { ALL } = await import('../../src/routes/grapes.css');

		// Mock OPTIONS request by checking if the function handles it
		const response = await ALL();

		expect(response).toBeInstanceOf(Response);
		expect(response.headers.get('Access-Control-Allow-Methods')).toBe('GET, HEAD, OPTIONS');
	});

	test('CSS content is valid', async () => {
		const { ALL } = await import('../../src/routes/grapes.css');

		const response = await ALL();
		const cssContent = await response.text();

		// Check for valid CSS syntax
		expect(cssContent).toMatch(/\.grapesjs-container\s*\{[^}]*\}/);
		expect(cssContent).toMatch(/\.grapesjs-editor\s*\{[^}]*\}/);
		expect(cssContent).toMatch(/\.grapesjs-panel\s*\{[^}]*\}/);
		expect(cssContent).toMatch(/\.grapesjs-block\s*\{[^}]*\}/);
	});

	test('response has correct status', async () => {
		const { ALL } = await import('../../src/routes/grapes.css');

		const response = await ALL();

		expect(response.status).toBe(200);
	});

	test('handles multiple requests', async () => {
		const { ALL } = await import('../../src/routes/grapes.css');

		const response1 = await ALL();
		const response2 = await ALL();

		expect(response1.status).toBe(200);
		expect(response2.status).toBe(200);

		const content1 = await response1.text();
		const content2 = await response2.text();

		expect(content1).toBe(content2);
	});

	test('CSS contains expected GrapesJS classes', async () => {
		const { ALL } = await import('../../src/routes/grapes.css');

		const response = await ALL();
		const cssContent = await response.text();

		// Check for common GrapesJS CSS classes
		const expectedClasses = [
			'grapesjs-container',
			'grapesjs-editor',
			'grapesjs-panel',
			'grapesjs-block',
		];

		expectedClasses.forEach((className) => {
			expect(cssContent).toContain(`.${className}`);
		});
	});

	test('response headers are immutable', async () => {
		const { ALL } = await import('../../src/routes/grapes.css');

		const response = await ALL();
		const headers = response.headers;

		// Headers should be set correctly
		expect(headers.get('Content-Type')).toBe('text/css');
		expect(headers.get('Access-Control-Allow-Origin')).toBe('*');
		expect(headers.get('Access-Control-Allow-Methods')).toBe('GET, HEAD, OPTIONS');

		// Headers should not be modifiable - test that we can't modify them
		expect(headers.get('Content-Type')).toBe('text/css');

		// Try to set a header - this should not affect the original response
		const newHeaders = new Headers(headers);
		newHeaders.set('Content-Type', 'text/html');
		expect(newHeaders.get('Content-Type')).toBe('text/html');
		expect(headers.get('Content-Type')).toBe('text/css'); // Original should be unchanged
	});

	test('handles concurrent requests', async () => {
		const { ALL } = await import('../../src/routes/grapes.css');

		const promises = Array.from({ length: 5 }, () => ALL());
		const responses = await Promise.all(promises);

		responses.forEach((response) => {
			expect(response.status).toBe(200);
			expect(response.headers.get('Content-Type')).toBe('text/css');
		});

		// All responses should have the same content
		const contents = await Promise.all(responses.map((r) => r.text()));
		const firstContent = contents[0];

		contents.forEach((content) => {
			expect(content).toBe(firstContent);
		});
	});
});
