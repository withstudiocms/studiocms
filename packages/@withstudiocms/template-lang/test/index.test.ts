import * as allure from 'allure-js-commons';
import { describe, expect, test } from 'vitest';
import { TemplateEngine, TemplateParser, TemplateRenderer } from '../src/index';

const parentSuiteName = '@withstudiocms/template-lang Package Tests';

describe(parentSuiteName, async () => {
	// TemplateRenderer tests
	[
		{
			name: 'TemplateRenderer - Basic rendering of simple variables',
			template: 'Hello {{name}}!',
			data: { name: 'World' },
			expected: 'Hello World!',
		},
		{
			name: 'TemplateRenderer - Nested property access',
			template: '{{user.name}}',
			data: { user: { name: 'John' } },
			expected: 'John',
		},
		{
			name: 'TemplateRenderer - Deep nested properties',
			template: '{{a.b.c.d}}',
			data: { a: { b: { c: { d: 'deep' } } } },
			expected: 'deep',
		},
		{
			name: 'TemplateRenderer - Missing variable with default empty string',
			template: 'Hello {{missing}}!',
			data: {},
			expected: 'Hello !',
		},
		{
			name: 'TemplateRenderer - Missing variable with custom default value',
			template: 'Hello {{missing}}!',
			data: {},
			options: { defaultValue: '[MISSING]' },
			expected: 'Hello [MISSING]!',
		},
		{
			name: 'TemplateRenderer - Strict mode throws error on missing variable',
			template: 'Hello {{missing}}!',
			data: {},
			options: { strict: true },
			throws: "Template variable 'missing' not found in data context",
		},
		{
			name: 'TemplateRenderer - Number conversion to string',
			template: 'Count: {{count}}',
			data: { count: 42 },
			expected: 'Count: 42',
		},
		{
			name: 'TemplateRenderer - Boolean conversion to string',
			template: 'Active: {{active}}',
			data: { active: true },
			expected: 'Active: true',
		},
		{
			name: 'TemplateRenderer - Handling null values',
			template: 'Value: {{value}}',
			data: { value: null },
			expected: 'Value: ',
		},
		{
			name: 'TemplateRenderer - Handling undefined values',
			template: 'Value: {{value}}',
			data: { value: undefined },
			expected: 'Value: ',
		},
	].forEach(({ name, template, data, options, expected, throws }) => {
		test(name, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite('TemplateRenderer Tests');
			await allure.subSuite(name);
			await allure.tags('package:@withstudiocms/template-lang', 'type:unit', 'scope:withstudiocms');
			await allure.parameter('template', template);
			await allure.parameter('data', JSON.stringify(data));
			await allure.parameter('options', JSON.stringify(options));

			const renderer = new TemplateRenderer(options);
			if (throws) {
				await allure.step(`Expecting error: ${throws}`, async (ctx) => {
					await ctx.displayName(`Expecting error: ${throws}`);
					await ctx.parameter('throws', throws);
					expect(() => {
						renderer.render(template, data);
					}).toThrow(throws);
				});
			} else {
				await allure.step('Rendering template', async (ctx) => {
					await ctx.displayName('Rendering template');
					const result = renderer.render(template, data);
					await ctx.parameter('result', result);
					expect(result).toBe(expected);
				});
			}
		});
	});

	[
		{
			name: 'TemplateRenderer - Should allow updating options',
			engineOpts: undefined,
			template: '{{missing}}',
			data: {},
			initialExpected: '',
			updatedOptions: { defaultValue: '[MISSING]' },
			updatedExpected: '[MISSING]',
		},
	].forEach(
		({ name, engineOpts, template, data, initialExpected, updatedOptions, updatedExpected }) => {
			test(name, async () => {
				await allure.parentSuite(parentSuiteName);
				await allure.suite('TemplateRenderer Tests');
				await allure.subSuite(name);
				await allure.tags(
					'package:@withstudiocms/template-lang',
					'type:unit',
					'scope:withstudiocms'
				);
				await allure.parameter('template', template);
				await allure.parameter('data', JSON.stringify(data));
				await allure.parameter('initial engine options', JSON.stringify(engineOpts));
				await allure.parameter('updated options', JSON.stringify(updatedOptions));

				const renderer = new TemplateRenderer(engineOpts);

				await allure.step('Rendering with initial options', async (ctx) => {
					await ctx.displayName('Rendering with initial options');
					const result = renderer.render(template, data);
					await ctx.parameter('result', result);
					expect(result).toBe(initialExpected);
				});

				await allure.step('Updating options', async (ctx) => {
					await ctx.displayName('Updating options');
					renderer.setOptions(updatedOptions);
				});

				await allure.step('Rendering with updated options', async (ctx) => {
					await ctx.displayName('Rendering with updated options');
					const result = renderer.render(template, data);
					await ctx.parameter('result', result);
					expect(result).toBe(updatedExpected);
				});
			});
		}
	);

	// TemplateParser tests
	[
		{
			name: 'TemplateParser - Should parse simple variable',
			template: 'Hello {{name}}!',
			length: 1,
			expected: [
				{
					match: '{{name}}',
					name: 'name',
					start: 6,
					end: 14,
				},
			],
		},
		{
			name: 'TemplateParser - Should parse multiple variables',
			template: '{{greeting}} {{name}}!',
			length: 2,
			expected: [
				{
					match: '{{greeting}}',
					name: 'greeting',
					start: 0,
					end: 12,
				},
				{
					match: '{{name}}',
					name: 'name',
					start: 13,
					end: 21,
				},
			],
		},
		{
			name: 'TemplateParser - Should parse nested variables',
			template: '{{user.name}} and {{user.email}}',
			length: 2,
			expected: [
				{
					match: '{{user.name}}',
					name: 'user.name',
					start: 0,
					end: 13,
				},
				{
					match: '{{user.email}}',
					name: 'user.email',
					start: 18,
					end: 32,
				},
			],
		},
		{
			name: 'TemplateParser - Should handle variables with spaces',
			template: '{{ spaced }}',
			length: 1,
			expected: [
				{
					match: '{{ spaced }}',
					name: 'spaced',
					start: 0,
					end: 12,
				},
			],
		},
		{
			name: 'TemplateParser - Should return empty array for no variables',
			template: 'No variables here',
			length: 0,
			expected: [],
		},
		{
			name: 'TemplateParser - Should handle duplicate variables',
			template: '{{name}} and {{name}} again',
			length: 2,
			expected: [
				{
					match: '{{name}}',
					name: 'name',
					start: 0,
					end: 8,
				},
				{
					match: '{{name}}',
					name: 'name',
					start: 13,
					end: 21,
				},
			],
		},
	].forEach(({ name, template, length, expected }) => {
		test(name, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite('TemplateParser Tests');
			await allure.subSuite(name);
			await allure.tags('package:@withstudiocms/template-lang', 'type:unit', 'scope:withstudiocms');
			await allure.parameter('template', template);
			await allure.parameter('length', String(length));
			await allure.parameter('expected', JSON.stringify(expected));

			await allure.step('Parsing template', async (ctx) => {
				const result = TemplateParser.parse(template);
				await ctx.parameter('result', JSON.stringify(result));
				await ctx.parameter('length', String(result.length));

				expect(result).toHaveLength(length);
				expect(result).toEqual(expected);
			});
		});
	});

	[
		{
			name: 'TemplateParser - Should return true when variables exist (1)',
			template: 'Hello {{name}}!',
			expected: true,
		},
		{
			name: 'TemplateParser - Should return false when variables exist (2)',
			template: '{{start}} middle {{end}}',
			expected: true,
		},
		{
			name: 'TemplateParser - Should return false when no variables exist (1)',
			template: 'No variables here',
			expected: false,
		},
		{
			name: 'TemplateParser - Should return false when no variables exist (2)',
			template: '{ Just some text }',
			expected: false,
		},
	].forEach(({ name, template, expected }) => {
		test(name, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite('TemplateParser Tests');
			await allure.subSuite(name);
			await allure.tags('package:@withstudiocms/template-lang', 'type:unit', 'scope:withstudiocms');
			await allure.parameter('template', template);
			await allure.parameter('expected', String(expected));

			await allure.step('Checking for variables in template', async (ctx) => {
				const result = TemplateParser.hasVariables(template);
				await ctx.parameter('result', String(result));
				expect(result).toBe(expected);
			});
		});
	});

	// TemplateEngine tests
	const sharedEngine = new TemplateEngine();

	[
		{
			name: 'TemplateEngine - Basic rendering of simple variables',
			template: 'Hello {{name}}!',
			data: { name: 'World' },
			expected: 'Hello World!',
		},
		{
			name: 'TemplateEngine - Nested property access',
			template: '{{user.name}}',
			data: { user: { name: 'John' } },
			expected: 'John',
		},
		{
			name: 'TemplateEngine - Should handle multiple variables',
			template: '{{greeting}} {{name}}, {{message}}',
			data: {
				greeting: 'Hello',
				name: 'Alice',
				message: 'welcome!',
			},
			expected: 'Hello Alice, welcome!',
		},
		{
			name: 'TemplateEngine - Should handle missing variables in non-strict mode',
			template: 'Hello {{name}}! Your age is {{age}}.',
			data: { name: 'Bob' },
			expected: 'Hello Bob! Your age is .',
		},
		{
			name: 'TemplateEngine - Should handle empty templates',
			template: '',
			data: { name: 'test' },
			expected: '',
		},
		{
			name: 'TemplateEngine - Should handle templates with no variables',
			template: 'This is just plain text',
			data: { name: 'test' },
			expected: 'This is just plain text',
		},
		{
			name: 'TemplateEngine - Should handle deep nesting',
			template: '{{a.b.c.d}}',
			data: { a: { b: { c: { d: 'deep' } } } },
			expected: 'deep',
		},
	].forEach(({ name, template, data, expected }) => {
		test(name, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite('TemplateEngine Tests');
			await allure.subSuite(name);
			await allure.tags('package:@withstudiocms/template-lang', 'type:unit', 'scope:withstudiocms');
			await allure.parameter('template', template);
			await allure.parameter('data', JSON.stringify(data));

			const result = sharedEngine.render(template, data);
			await allure.step('Rendering template', async (ctx) => {
				await ctx.parameter('result', result);
				expect(result).toBe(expected);
			});
		});
	});

	[
		{
			name: 'TemplateEngine - Strict mode should throw error for missing variables',
			engineOpts: { strict: true },
			template: 'Hello {{missingVariable}}!',
			data: { name: 'John' },
			throws: "Template variable 'missingVariable' not found in data context",
		},
		{
			name: 'TemplateEngine - Should use default value for missing variables',
			engineOpts: { defaultValue: '[NOT SET]' },
			template: 'Hello {{name}}! Your role is {{role}}.',
			data: { name: 'Alice' },
			expected: 'Hello Alice! Your role is [NOT SET].',
		},
	].forEach(({ name, engineOpts, template, data, expected, throws }) => {
		test(name, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite('TemplateEngine Tests');
			await allure.subSuite(name);
			await allure.tags('package:@withstudiocms/template-lang', 'type:unit', 'scope:withstudiocms');
			await allure.parameter('template', template);
			await allure.parameter('data', JSON.stringify(data));
			await allure.parameter('engine options', JSON.stringify(engineOpts));

			const engine = new TemplateEngine(engineOpts);

			if (throws) {
				await allure.step(`Expecting error: ${throws}`, async (ctx) => {
					await ctx.displayName(`Expecting error: ${throws}`);
					await ctx.parameter('throws', throws);
					expect(() => {
						engine.render(template, data);
					}).toThrow(throws);
				});
			} else {
				await allure.step('Rendering template', async (ctx) => {
					await ctx.displayName('Rendering template');
					await ctx.parameter('expected', expected as string);
					const result = engine.render(template, data);
					await ctx.parameter('result', result);
					expect(result).toBe(expected);
				});
			}
		});
	});

	[
		{
			name: 'TemplateEngine - Should detect if template has variables',
			template: 'Hello {{name}}!',
			expected: true,
			type: 'hasVariables',
		},
		{
			name: 'TemplateEngine - Should detect if template has no variables',
			template: 'Hello world!',
			expected: false,
			type: 'hasVariables',
		},
		{
			name: 'TemplateEngine - Should extract variable names from template',
			template: 'Hello {{name}}! You have {{count}} messages from {{sender.name}}.',
			expected: ['name', 'count', 'sender.name'],
			type: 'getVariables',
		},
		{
			name: 'TemplateEngine - Should remove duplicate variable names',
			template: '{{name}} {{name}} {{other}}',
			expected: ['name', 'other'],
			type: 'getVariables',
		},
	].forEach(({ name, template, expected, type }) => {
		test(name, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite('TemplateEngine Tests');
			await allure.subSuite(name);
			await allure.tags('package:@withstudiocms/template-lang', 'type:unit', 'scope:withstudiocms');
			await allure.parameter('template', template);
			await allure.parameter('expected', JSON.stringify(expected));

			let result: boolean | string[];
			if (type === 'hasVariables') {
				result = sharedEngine.hasVariables(template);
			} else if (type === 'getVariables') {
				result = sharedEngine.getVariables(template);
			}

			await allure.step(`Executing ${type}`, async (ctx) => {
				await ctx.parameter('result', JSON.stringify(result));
				expect(result).toEqual(expected);
			});
		});
	});

	test('TemplateEngine - Should allow updating options after creation', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite('TemplateEngine Tests');
		await allure.subSuite('TemplateEngine - Should allow updating options after creation');
		await allure.tags('package:@withstudiocms/template-lang', 'type:unit', 'scope:withstudiocms');

		const testEngine = new TemplateEngine();

		const initialTemplate = 'Hello {{name}}! Your role is {{role}}.';
		const initialData = { name: 'Bob' };
		const initialExpected = 'Hello Bob! Your role is .';

		await allure.parameter('initial template', initialTemplate);
		await allure.parameter('initial data', JSON.stringify(initialData));
		await allure.parameter('initial expected', initialExpected);

		await allure.step('Rendering with initial options', async (ctx) => {
			await ctx.displayName('Rendering with initial options');
			const result = testEngine.render(initialTemplate, initialData);
			await ctx.parameter('result', result);
			expect(result).toBe(initialExpected);
		});

		const updatedOptions = { defaultValue: '[UNKNOWN]' };

		await allure.step('Updating engine options', async (ctx) => {
			await ctx.displayName('Updating engine options');
			await ctx.parameter('updated options', JSON.stringify(updatedOptions));
			testEngine.setOptions(updatedOptions);
		});

		const updatedExpected = 'Hello Bob! Your role is [UNKNOWN].';

		await allure.step('Rendering with updated options', async (ctx) => {
			await ctx.displayName('Rendering with updated options');
			await ctx.parameter('updated expected', updatedExpected);
			const result = testEngine.render(initialTemplate, initialData);
			await ctx.parameter('result', result);
			expect(result).toBe(updatedExpected);
		});
	});

	test('TemplateEngine - Should compile templates for reuse', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite('TemplateEngine Tests');
		await allure.subSuite('TemplateEngine - Should compile templates for reuse');
		await allure.tags('package:@withstudiocms/template-lang', 'type:unit', 'scope:withstudiocms');

		const engine = new TemplateEngine();
		const template = 'Dear {{title}} {{lastName}}, your order {{orderId}} is confirmed.';
		const compiled = engine.compile(template);

		await allure.parameter('template', template);

		[
			{
				data: { title: 'Mr.', lastName: 'Smith', orderId: '12345' },
				expected: 'Dear Mr. Smith, your order 12345 is confirmed.',
			},
			{
				data: { title: 'Ms.', lastName: 'Johnson', orderId: '67890' },
				expected: 'Dear Ms. Johnson, your order 67890 is confirmed.',
			},
		].forEach(async ({ data, expected }, index) => {
			await allure.step(`Rendering compiled template with data set ${index + 1}`, async (ctx) => {
				await ctx.displayName(`Rendering compiled template with data set ${index + 1}`);
				await ctx.parameter('data', JSON.stringify(data));
				await ctx.parameter('expected', expected);
				const result = compiled(data);
				await ctx.parameter('result', result);
				expect(result).toBe(expected);
			});
		});
	});
});
