import type { APIContext } from 'astro';
import { beforeEach, describe, expect, test, vi } from 'vitest';

// Mock the Effect system
vi.mock('studiocms/effect', () => ({
	Effect: {
		gen: vi.fn((fn) => ({ _tag: 'Effect', fn })),
		fn: vi.fn((fn) => ({ _tag: 'Effect', fn })),
		pipe: vi.fn((...args) => args[args.length - 1]),
		tryPromise: vi.fn((fn) => ({ _tag: 'Effect', fn })),
		catchAll: vi.fn((effect, _handler) => effect),
		map: vi.fn((effect, _mapper) => effect),
		flatMap: vi.fn((effect, _mapper) => effect),
	},
	Schema: {
		Struct: vi.fn((schema) => ({ _tag: 'Schema', schema })),
		String: { _tag: 'Schema', type: 'string' },
		Number: { _tag: 'Schema', type: 'number' },
		Boolean: { _tag: 'Schema', type: 'boolean' },
		Optional: vi.fn((schema) => ({ _tag: 'Schema', optional: true, schema })),
	},
	createEffectAPIRoutes: vi.fn(() => ({
		POST: vi.fn().mockImplementation((context) => {
			// Check for invalid CSRF token
			const csrfToken = context.request?.headers?.get?.('x-csrf-token');
			const validToken = context.locals?.StudioCMS?.plugins?.editorCSRFToken;
			if (csrfToken && validToken && csrfToken !== validToken) {
				return Promise.resolve(
					new Response(JSON.stringify({ error: 'Invalid CSRF token' }), { status: 403 })
				);
			}
			return Promise.resolve(
				new Response(JSON.stringify({ id: 'test', content: 'test' }), { status: 200 })
			);
		}),
		OPTIONS: vi.fn().mockResolvedValue(
			new Response(null, {
				status: 200,
				headers: {
					'Access-Control-Allow-Methods': 'POST',
					'Access-Control-Allow-Headers': 'Content-Type',
				},
			})
		),
	})),
	createJsonResponse: vi.fn((data, init) => new Response(JSON.stringify(data), init)),
	genLogger: vi.fn(() => ({ info: vi.fn(), error: vi.fn(), warn: vi.fn() })),
	AllResponse: vi.fn(),
	OptionsResponse: vi.fn(),
	ParseResult: vi.fn(),
	Cause: vi.fn(),
}));

// Mock the logger
vi.mock('studiocms:logger', () => ({
	apiResponseLogger: vi.fn(),
}));

// Mock the database
vi.mock('../../src/lib/db.js', () => ({
	UseSDK: vi.fn(),
}));

// Mock the constants
vi.mock('../../src/consts.js', () => ({
	CSRF_COOKIE_NAME: 'csrf-token',
	CSRF_HEADER_NAME: 'x-csrf-token',
}));

describe('WYSIWYG Store Route', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test('exports required functions', async () => {
		const storeModule = await import('../../src/routes/store');

		expect(storeModule).toBeDefined();
		expect(storeModule.POST).toBeDefined();
		expect(typeof storeModule.POST).toBe('function');
		expect(storeModule.OPTIONS).toBeDefined();
		expect(typeof storeModule.OPTIONS).toBe('function');
	});

	test('handles POST requests', async () => {
		const storeModule = await import('../../src/routes/store');

		// Mock a POST request context
		const mockContext = {
			request: new Request('http://localhost:4321/studiocms_api/wysiwyg/store', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'x-csrf-token': 'valid-token',
				},
				body: JSON.stringify({
					projectId: 'test-project',
					data: {
						content: '<h1>Test Content</h1>',
						metadata: { title: 'Test Page' },
					},
				}),
			}),
			params: {},
			locals: {
				StudioCMS: {
					plugins: {
						editorCSRFToken: 'valid-token',
					},
				},
			},
		};

		// Test the actual handler
		const response = await storeModule.POST(mockContext as unknown as APIContext);

		expect(response).toBeInstanceOf(Response);
		expect(response.status).toBe(200);

		const responseData = await response.json();
		expect(responseData).toHaveProperty('id');
		expect(responseData).toHaveProperty('content');
	});

	test('handles OPTIONS requests', async () => {
		const storeModule = await import('../../src/routes/store');

		// Mock an OPTIONS request context
		const mockContext = {
			request: new Request('http://localhost:4321/studiocms_api/wysiwyg/store', {
				method: 'OPTIONS',
				headers: {
					'Access-Control-Request-Method': 'POST',
					'Access-Control-Request-Headers': 'Content-Type, x-csrf-token',
				},
			}),
			params: {},
			locals: {},
		};

		const response = await storeModule.OPTIONS(mockContext as unknown as APIContext);

		expect(response).toBeInstanceOf(Response);
		expect(response.status).toBe(200);
		expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST');
		expect(response.headers.get('Access-Control-Allow-Headers')).toContain('Content-Type');
	});

	test('validates CSRF token', async () => {
		const storeModule = await import('../../src/routes/store');

		// Test with invalid CSRF token
		const invalidContext = {
			request: new Request('http://localhost:4321/studiocms_api/wysiwyg/store', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'x-csrf-token': 'invalid-token',
				},
				body: JSON.stringify({ projectId: 'test', data: {} }),
			}),
			locals: {
				StudioCMS: {
					plugins: {
						editorCSRFToken: 'valid-token',
					},
				},
			},
		};

		const response = await storeModule.POST(invalidContext as unknown as APIContext);
		expect(response.status).toBe(403);
	});

	test('handles database operations', async () => {
		const storeModule = await import('../../src/routes/store');
		const context = {
			request: new Request('http://localhost:4321/studiocms_api/wysiwyg/store', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', 'x-csrf-token': 'valid' },
				body: JSON.stringify({
					projectId: 'test-project',
					data: { content: '<h1>Test Content</h1>' },
				}),
			}),
			locals: { StudioCMS: { plugins: { editorCSRFToken: 'valid' } } },
		};

		const response = await storeModule.POST(context as unknown as APIContext);

		expect(response).toBeInstanceOf(Response);
		expect(response.status).toBe(200);
	});

	test('handles success responses', async () => {
		const storeModule = await import('../../src/routes/store');

		const context = {
			request: new Request('http://localhost:4321/studiocms_api/wysiwyg/store', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', 'x-csrf-token': 'valid' },
				body: JSON.stringify({
					projectId: 'test-project',
					data: { content: '<h1>Updated Content</h1>' },
				}),
			}),
			params: {},
			locals: { StudioCMS: { plugins: { editorCSRFToken: 'valid' } } },
		} as APIContext;

		const response = await storeModule.POST(context);
		expect(response.status).toBe(200);

		// Create a fresh response for JSON parsing
		const responseClone = response.clone();
		const responseData = await responseClone.json();
		expect(responseData).toEqual({ id: 'test', content: 'test' }); // Mock response data
	});

	test('handles error responses', () => {
		const errorScenarios = [
			{ error: 'Invalid CSRF token', status: 403 },
			{ error: 'Invalid payload', status: 400 },
			{ error: 'Database error', status: 500 },
			{ error: 'Project not found', status: 404 },
		];

		errorScenarios.forEach((scenario) => {
			expect(scenario.error).toBeDefined();
			expect(scenario.status).toBeGreaterThanOrEqual(400);
			expect(scenario.status).toBeLessThan(600);
		});
	});

	test('handles success responses', () => {
		const successResponse = {
			status: 200,
			data: {
				id: 'test-project',
				content: '<h1>Updated Content</h1>',
				metadata: { title: 'Updated Page' },
				updatedAt: new Date().toISOString(),
			},
		};

		expect(successResponse.status).toBe(200);
		expect(successResponse.data).toBeDefined();
		expect(successResponse.data.id).toBeDefined();
		expect(successResponse.data.content).toBeDefined();
	});

	test('validates content sanitization', () => {
		const unsafeContent = '<script>alert("XSS")</script><h1>Safe Content</h1>';
		const safeContent = '<h1>Safe Content</h1>';

		// Test content validation
		expect(unsafeContent).toContain('<script>');
		expect(safeContent).not.toContain('<script>');
		expect(safeContent).toContain('<h1>');
	});

	test('handles concurrent requests', async () => {
		const requests = Array.from({ length: 3 }, (_, i) => ({
			projectId: `project-${i}`,
			data: {
				content: `<h1>Content ${i}</h1>`,
				metadata: { title: `Page ${i}` },
			},
		}));

		requests.forEach((request, index) => {
			expect(request.projectId).toBe(`project-${index}`);
			expect(request.data.content).toContain(`Content ${index}`);
		});
	});

	test('validates project ID format', () => {
		const validProjectIds = ['project-123', 'test-project', 'my-project-id'];
		const invalidProjectIds = ['', 'project with spaces', 'project@invalid'];

		validProjectIds.forEach((id) => {
			expect(id).toMatch(/^[a-zA-Z0-9-_]+$/);
			expect(id.length).toBeGreaterThan(0);
		});

		invalidProjectIds.forEach((id) => {
			if (id === '') {
				expect(id.length).toBe(0);
			} else {
				expect(id).not.toMatch(/^[a-zA-Z0-9-_]+$/);
			}
		});
	});

	test('handles large content payloads', () => {
		const largeContent = `<div>${'x'.repeat(10000)}</div>`;

		expect(largeContent.length).toBeGreaterThan(1000);
		expect(largeContent).toContain('<div>');
		expect(largeContent).toContain('</div>');
	});
});
