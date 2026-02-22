import * as allure from 'allure-js-commons';
import { describe, expect, test } from 'vitest';
import { extractFrontmatter, parseFrontmatter } from '../../src/core/frontmatter.js';
import { parentSuiteName, sharedTags } from '../test-utils.js';

const localSuiteName = 'Frontmatter utility Tests';

describe(parentSuiteName, () => {
	const bom = '\uFEFF';
	const yaml = '\nfoo: bar\n';
	[
		{
			case: `---${yaml}---`,
			validate: (result: string | undefined) => expect(result).toBe(yaml),
		},
		{
			case: `${bom}---${yaml}---`,
			validate: (result: string | undefined) => expect(result).toBe(yaml),
		},
		{
			case: `\n---${yaml}---`,
			validate: (result: string | undefined) => expect(result).toBe(yaml),
		},
		{
			case: `\n  \n---${yaml}---`,
			validate: (result: string | undefined) => expect(result).toBe(yaml),
		},
		{
			case: `---${yaml}---\ncontent`,
			validate: (result: string | undefined) => expect(result).toBe(yaml),
		},
		{
			case: `${bom}---${yaml}---\ncontent`,
			validate: (result: string | undefined) => expect(result).toBe(yaml),
		},
		{
			case: `\n\n---${yaml}---\n\ncontent`,
			validate: (result: string | undefined) => expect(result).toBe(yaml),
		},
		{
			case: `\n  \n---${yaml}---\n\ncontent`,
			validate: (result: string | undefined) => expect(result).toBe(yaml),
		},
		{
			case: ` ---${yaml}---`,
			validate: (result: string | undefined) => expect(result).toBeUndefined(),
		},
		{
			case: `---${yaml} ---`,
			validate: (result: string | undefined) => expect(result).toBeUndefined(),
		},
		{
			case: `text\n---${yaml}---\n\ncontent`,
			validate: (result: string | undefined) => expect(result).toBeUndefined(),
		},
	].forEach(({ case: markdown, validate }) => {
		test(`extractFrontmatter - ${markdown.replace(/\n/g, '\\n')}`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('extractFrontmatter Tests');
			await allure.tags(...sharedTags);

			const result = extractFrontmatter(markdown);
			validate(result);
		});
	});

	[
		{
			case: `---${yaml}---`,
			validate: (result: ReturnType<typeof parseFrontmatter>) =>
				expect(result).toEqual({
					frontmatter: { foo: 'bar' },
					rawFrontmatter: yaml,
					content: '',
				}),
		},
		{
			case: `${bom}---${yaml}---`,
			validate: (result: ReturnType<typeof parseFrontmatter>) =>
				expect(result).toEqual({
					frontmatter: { foo: 'bar' },
					rawFrontmatter: yaml,
					content: bom,
				}),
		},
		{
			case: `\n---${yaml}---`,
			validate: (result: ReturnType<typeof parseFrontmatter>) =>
				expect(result).toEqual({
					frontmatter: { foo: 'bar' },
					rawFrontmatter: yaml,
					content: '\n',
				}),
		},
		{
			case: `\n  \n---${yaml}---`,
			validate: (result: ReturnType<typeof parseFrontmatter>) =>
				expect(result).toEqual({
					frontmatter: { foo: 'bar' },
					rawFrontmatter: yaml,
					content: '\n  \n',
				}),
		},
		{
			case: `---${yaml}---\ncontent`,
			validate: (result: ReturnType<typeof parseFrontmatter>) =>
				expect(result).toEqual({
					frontmatter: { foo: 'bar' },
					rawFrontmatter: yaml,
					content: '\ncontent',
				}),
		},
		{
			case: `${bom}---${yaml}---\ncontent`,
			validate: (result: ReturnType<typeof parseFrontmatter>) =>
				expect(result).toEqual({
					frontmatter: { foo: 'bar' },
					rawFrontmatter: yaml,
					content: `${bom}\ncontent`,
				}),
		},
		{
			case: `\n\n---${yaml}---\n\ncontent`,
			validate: (result: ReturnType<typeof parseFrontmatter>) =>
				expect(result).toEqual({
					frontmatter: { foo: 'bar' },
					rawFrontmatter: yaml,
					content: '\n\n\n\ncontent',
				}),
		},
		{
			case: `\n  \n---${yaml}---\n\ncontent`,
			validate: (result: ReturnType<typeof parseFrontmatter>) =>
				expect(result).toEqual({
					frontmatter: { foo: 'bar' },
					rawFrontmatter: yaml,
					content: '\n  \n\n\ncontent',
				}),
		},
		{
			case: ` ---${yaml}---`,
			validate: (result: ReturnType<typeof parseFrontmatter>) =>
				expect(result).toEqual({
					frontmatter: {},
					rawFrontmatter: '',
					content: ` ---${yaml}---`,
				}),
		},
		{
			case: `---${yaml} ---`,
			validate: (result: ReturnType<typeof parseFrontmatter>) =>
				expect(result).toEqual({
					frontmatter: {},
					rawFrontmatter: '',
					content: `---${yaml} ---`,
				}),
		},
		{
			case: `text\n---${yaml}---\n\ncontent`,
			validate: (result: ReturnType<typeof parseFrontmatter>) =>
				expect(result).toEqual({
					frontmatter: {},
					rawFrontmatter: '',
					content: `text\n---${yaml}---\n\ncontent`,
				}),
		},
	].forEach(({ case: markdown, validate }) => {
		test(`parseFrontmatter - ${markdown.replace(/\n/g, '\\n')}`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('parseFrontmatter Tests');
			await allure.tags(...sharedTags);

			const result = parseFrontmatter(markdown);
			validate(result);
		});
	});

	[
		{
			content: `---${yaml}---`,
			cases: [
				{
					style: 'preserve' as const,
					expected: `---${yaml}---`,
				},
				{
					style: 'remove' as const,
					expected: '',
				},
				{
					style: 'empty-with-spaces' as const,
					expected: '   \n        \n   ',
				},
				{
					style: 'empty-with-lines' as const,
					expected: '\n\n',
				},
			],
		},
		{
			content: `\n  \n---${yaml}---\n\ncontent`,
			cases: [
				{
					style: 'preserve' as const,
					expected: `\n  \n---${yaml}---\n\ncontent`,
				},
				{
					style: 'remove' as const,
					expected: '\n  \n\n\ncontent',
				},
				{
					style: 'empty-with-spaces' as const,
					expected: '\n  \n   \n        \n   \n\ncontent',
				},
				{
					style: 'empty-with-lines' as const,
					expected: '\n  \n\n\n\n\ncontent',
				},
			],
		},
	].forEach(({ content, cases }) => {
		cases.forEach(({ style, expected }) => {
			test(`parseFrontmatter with frontmatterStyle=${style} - ${content.replace(/\n/g, '\\n')}`, async () => {
				await allure.parentSuite(parentSuiteName);
				await allure.suite(localSuiteName);
				await allure.subSuite('parseFrontmatter frontmatterStyle Tests');
				await allure.tags(...sharedTags);

				const parsed = parseFrontmatter(content, { frontmatter: style }).content;

				expect(parsed).toBe(expected);
			});
		});
	});
});
