import * as allure from 'allure-js-commons';
import { describe, expect, test } from 'vitest';
import {
	convertToSafeString,
	jsonParse,
	loadChangelog,
	pageContentComponentFilter,
	readJson,
	rendererComponentFilter,
	semverCategories,
} from '../src/index.js';
import { mockMarkdown, parentSuiteName, sharedTags } from './test-utils.js';

const localSuiteName = 'Utility Functions';

describe(parentSuiteName, () => {
	// jsonParse tests
	[
		{
			input: '{"foo":"bar","baz":42}',
			expected: { foo: 'bar', baz: 42 },
			description: 'parses valid JSON string to object',
		},
		{
			input: '{"foo":}',
			expectedError: SyntaxError,
			description: 'throws SyntaxError on invalid JSON',
		},
	].forEach(({ input, expected, expectedError, description }) => {
		test(`jsonParse - ${description}`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite(`jsonParse - ${description}`);
			await allure.tags(...sharedTags);
			await allure.description(description);
			await allure.parameter('input', input);
			await allure.parameter(
				'expected',
				expectedError ? expectedError.name : JSON.stringify(expected)
			);

			if (expectedError) {
				await allure.step(`Expecting error: ${expectedError.name}`, async (ctx) => {
					expect(() => jsonParse(input)).toThrow(expectedError);
					await ctx.parameter('error', expectedError.name);
				});
			} else {
				await allure.step(`Expecting result: ${JSON.stringify(expected)}`, async (ctx) => {
					const result = jsonParse<typeof expected>(input);
					await ctx.parameter('result', JSON.stringify(result));
					expect(result).toEqual(expected);
				});
			}
		});
	});

	// readJson tests
	[
		{
			mockPath: '/fake/path/config.json',
			mockJson: '{"hello":"world","num":123}',
			expected: { hello: 'world', num: 123 },
			description: 'reads and parses JSON file content',
		},
		{
			mockPath: '/fake/path/config.json',
			mockJson: '{invalid}',
			expectedError: SyntaxError,
			description: 'throws SyntaxError if file content is invalid JSON',
		},
	].forEach(({ mockPath, mockJson, expected, expectedError, description }) => {
		test(`readJson - ${description}`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite(`readJson - ${description}`);
			await allure.tags(...sharedTags);
			await allure.description(description);
			await allure.parameter('mockPath', mockPath);
			await allure.parameter('mockJson', expectedError ? mockJson : JSON.stringify(expected));

			let mockReadFileSync: undefined | ((path: string | URL, encoding: BufferEncoding) => string);

			await allure.step('Setting up mockReadFileSync function', async (ctx) => {
				mockReadFileSync = (path: string | URL, encoding: BufferEncoding) => {
					expect(path).toBe(mockPath);
					expect(encoding).toBe('utf-8');
					return mockJson;
				};
				await ctx.parameter('mockReadFileSync set up for path', mockPath);
			});

			if (expectedError) {
				await allure.step(`Expecting error: ${expectedError.name}`, async (ctx) => {
					expect(() => readJson(mockPath, mockReadFileSync)).toThrow(expectedError);
					await ctx.parameter('error', expectedError.name);
				});
			} else {
				await allure.step(`Expecting result: ${JSON.stringify(expected)}`, async (ctx) => {
					const result = readJson<typeof expected>(mockPath, mockReadFileSync);
					await ctx.parameter('result', JSON.stringify(result));
					expect(result).toEqual(expected);
				});
			}
		});
	});

	// convertToSafeString tests
	[
		{
			input: 'Hello, World!',
			expected: 'hello__world',
			description: 'replaces non-alphanumeric with underscores and lowercases',
		},
		{
			input: 'foo@bar.com',
			expected: 'foo_bar_com',
			description: 'replaces non-alphanumeric with underscores and lowercases',
		},
		{
			input: 'foo-bar_baz',
			expected: 'foo_bar_baz',
			description: 'replaces non-alphanumeric with underscores and lowercases',
		},
		{
			input: '__foo__',
			expected: 'foo',
			description: 'trims leading and trailing underscores',
		},
		{
			input: '___foo_bar___',
			expected: 'foo_bar',
			description: 'trims leading and trailing underscores',
		},
		{
			input: '___',
			expected: '',
			description: 'returns empty string for input with only underscores',
		},
		{
			input: 'FOO_BAR',
			expected: 'foo_bar',
			description: 'lowercases the result',
		},
		{
			input: 'CamelCase123',
			expected: 'camelcase123',
			description: 'lowercases the result',
		},
		{
			input: '',
			expected: '',
			description: 'returns empty string for empty input',
		},
		{
			input: '!@#$%^&*()',
			expected: '',
			description: 'returns empty string for input with only special characters',
		},
	].forEach(({ input, expected, description }) => {
		test(`convertToSafeString - ${description}`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite(`convertToSafeString - ${description}`);
			await allure.tags(...sharedTags);
			await allure.description(description);
			await allure.parameter('input', input);
			await allure.parameter('expected', expected);

			await allure.step(`Expecting result: ${expected}`, async (ctx) => {
				const result = convertToSafeString(input);
				await ctx.parameter('result', result);
				expect(result).toBe(expected);
			});
		});
	});

	// rendererComponentFilter tests
	[
		{
			comp: './components/Renderer.astro',
			safePageType: 'BlogPage',
			expected: `export { default as BlogPage } from './components/Renderer.astro';`,
			description: 'returns correct export statement for valid input',
		},
		{
			comp: undefined,
			safePageType: 'HomePage',
			expectedError: 'Renderer Component path is required for page type: HomePage',
			description: 'throws error if comp is undefined',
		},
		{
			comp: '',
			safePageType: 'EmptyPage',
			expectedError: 'Renderer Component path is required for page type: EmptyPage',
			description: 'throws error if comp is empty string',
		},
	].forEach(({ comp, safePageType, expected, expectedError, description }) => {
		test(`rendererComponentFilter - ${description}`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite(`rendererComponentFilter - ${description}`);
			await allure.tags(...sharedTags);
			await allure.description(description);
			await allure.parameter('comp', String(comp));
			await allure.parameter('safePageType', safePageType);

			if (expectedError) {
				await allure.step(`Expecting error: ${expectedError}`, async (ctx) => {
					expect(() => rendererComponentFilter(comp, safePageType)).toThrowError(expectedError);
					await ctx.parameter('error', expectedError);
				});
			} else {
				await allure.step(`Expecting result: ${expected}`, async (ctx) => {
					const result = rendererComponentFilter(comp, safePageType);
					await ctx.parameter('result', result);
					expect(result).toBe(expected);
				});
			}
		});
	});

	// pageContentComponentFilter tests
	[
		{
			comp: './components/PageContent.astro',
			safePageType: 'DocsPage',
			expected: `export { default as DocsPage } from './components/PageContent.astro';`,
			description: 'returns correct export statement for valid input',
		},
		{
			comp: undefined,
			safePageType: 'LandingPage',
			expectedError: 'Page Content Component path is required for page type: LandingPage',
			description: 'throws error if comp is undefined',
		},
		{
			comp: '',
			safePageType: 'EmptyContentPage',
			expectedError: 'Page Content Component path is required for page type: EmptyContentPage',
			description: 'throws error if comp is empty string',
		},
	].forEach(({ comp, safePageType, expected, expectedError, description }) => {
		test(`pageContentComponentFilter - ${description}`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite(`pageContentComponentFilter - ${description}`);
			await allure.tags(...sharedTags);
			await allure.description(description);
			await allure.parameter('comp', String(comp));
			await allure.parameter('safePageType', safePageType);

			if (expectedError) {
				await allure.step(`Expecting error: ${expectedError}`, async (ctx) => {
					expect(() => pageContentComponentFilter(comp, safePageType)).toThrowError(expectedError);
					await ctx.parameter('error', expectedError);
				});
			} else {
				await allure.step(`Expecting result: ${expected}`, async (ctx) => {
					const result = pageContentComponentFilter(comp, safePageType);
					await ctx.parameter('result', result);
					expect(result).toBe(expected);
				});
			}
		});
	});

	// loadChangelog tests
	[
		{
			input: mockMarkdown,
			description: 'parses example changelog markdown',
			expected: {
				packageName: '@withstudiocms/config-utils',
				versionsLength: 3,
				firstVersion: '0.1.0-beta.3',
				secondVersion: '0.1.0-beta.2',
				thirdVersion: '0.1.0-beta.1',
			},
		},
		{
			input: '## 1.0.0\n### Major\n- Something',
			description: 'throws on unexpected structure',
			expectError: /Unexpected h2/,
		},
		{
			input: '# pkg\n## 1.0.0\n### Unknown\n- Something',
			description: 'throws on unknown semver category',
			expectError: /Unexpected semver category/,
		},
		{
			input: '# pkg\n## 1.0.0\n### major\n- Something\n### unknown\n- Something',
			description: 'throws on unknown semver category',
			expectError: /Unexpected semver category/,
		},
		{
			input: '# pkg\n> Not a heading',
			description: 'throws on unexpected node type',
			expectError: /Unexpected node/,
		},
	].forEach(({ input, description, expected, expectError }) => {
		test(`loadChangelog - ${description}`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite(`loadChangelog - ${description}`);
			await allure.tags(...sharedTags);
			await allure.description(description);
			await allure.parameter('input', input);

			if (expectError) {
				await allure.step(`Expecting error: ${expectError}`, async () => {
					expect(() => loadChangelog({ raw: input })).toThrow(expectError);
				});
			} else {
				await allure.step('Expecting parsed changelog', async (ctx) => {
					const changelog = loadChangelog({ raw: input });
					await ctx.parameter('packageName', changelog.packageName);
					expect(changelog.packageName).toBe(expected.packageName);
					expect(changelog.versions.length).toBe(expected.versionsLength);
					expect(changelog.versions[0].version).toBe(expected.firstVersion);
					expect(changelog.versions[1].version).toBe(expected.secondVersion);
					expect(changelog.versions[2].version).toBe(expected.thirdVersion);
				});
			}
		});
	});

	test('loadChangelog - parses semver categories and changes', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('loadChangelog - parses semver categories and changes');
		await allure.tags(...sharedTags);
		await allure.description('parses semver categories and changes from changelog markdown');
		await allure.parameter('input', mockMarkdown);

		const changelog = loadChangelog({ raw: mockMarkdown });

		await allure.step('Verifying semver categories and changes', async (ctx) => {
			for (const version of changelog.versions) {
				for (const cat of semverCategories) {
					const categoryInfo = version.changes[cat];
					await ctx.parameter(
						`Version ${version.version} - Category ${cat}`,
						JSON.stringify(categoryInfo)
					);

					expect(categoryInfo).toBeTruthy();
					expect(categoryInfo.type).toBe('list');
					expect(Array.isArray(categoryInfo.children)).toBe(true);
				}
			}
		});
	});

	test('loadChangelog - parses GitHub usernames to links', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('loadChangelog - parses GitHub usernames to links');
		await allure.tags(...sharedTags);
		await allure.description('parses GitHub usernames in changelog markdown to links');
		await allure.parameter('input', mockMarkdown);

		const changelog = loadChangelog({ raw: mockMarkdown });

		await allure.step('Verifying GitHub username links', async (ctx) => {
			const patchChanges = changelog.versions[0].changes.patch.children;

			const found = patchChanges.some((item: any) =>
				item.children[0].children.some(
					(node: any) =>
						typeof node.url === 'string' &&
						node.url.includes('https://github.com/Adammatthiesen') &&
						node.children.some(
							(child: any) =>
								typeof child.value === 'string' && child.value.includes('@Adammatthiesen')
						)
				)
			);
			await ctx.parameter('GitHub username link found', String(found));

			expect(found).toBe(true);
		});
	});
});
