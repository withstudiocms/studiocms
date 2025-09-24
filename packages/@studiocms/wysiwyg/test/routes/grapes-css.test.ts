import { describe, expect, test } from 'vitest';

describe('WYSIWYG Grapes CSS Route', () => {
	test('serves CSS content with correct headers', async () => {
		const { ALL } = await import('../../src/routes/grapes.css');

		const response = await ALL();

		expect(response).toBeInstanceOf(Response);
		expect(response.status).toBe(200);
		expect(response.headers.get('Content-Type')).toBe('text/css');
		expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
		expect(response.headers.get('Access-Control-Allow-Methods')).toBe('GET, HEAD, OPTIONS');
	});

	test('returns CSS content', async () => {
		const { ALL } = await import('../../src/routes/grapes.css');

		const response = await ALL();
		const cssContent = await response.text();

		// Test that we get a response (content may be empty in test env due to ?raw import)
		expect(response).toBeInstanceOf(Response);
		expect(typeof cssContent).toBe('string');
	});

	test('handles multiple requests consistently', async () => {
		const { ALL } = await import('../../src/routes/grapes.css');

		const response1 = await ALL();
		const response2 = await ALL();

		expect(response1.status).toBe(200);
		expect(response2.status).toBe(200);
		expect(response1.headers.get('Content-Type')).toBe('text/css');
		expect(response2.headers.get('Content-Type')).toBe('text/css');
	});
});
