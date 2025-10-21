import { Effect, runEffect } from '@withstudiocms/effect';
import * as allure from 'allure-js-commons';
import { describe, expect, test } from 'vitest';
import { PropsParser } from '../../src/registry/PropsParser.js';
import { parentSuiteName, sharedTags } from '../test-utils.js';

const localSuiteName = 'Props Parser Tests';

describe(parentSuiteName, async () => {
	const parser = await runEffect(PropsParser.pipe(Effect.provide(PropsParser.Default)));

	test('PropsParser - parseComponentProps - parse interface props with JSDoc', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('parseComponentProps Tests');
		await allure.tags(...sharedTags);

		await allure.step('Parse component props from source code', async () => {
			const source = `
                /**
                 * Props for MyComponent
                 */
                export interface Props {
                    /** The title to display */
                    title: string;
                    /** The count (optional) */
                    count?: number;
                    /**
                     * Is enabled
                     * @default true
                     */
                    enabled?: boolean;
                }
            `;
			const result = await runEffect(parser.parseComponentProps(source));
			expect(result).toHaveLength(1);
			expect(result[0].name).toBe('Props');
			expect(result[0].props).toEqual(
				expect.arrayContaining([
					expect.objectContaining({ name: 'title', type: 'string', optional: false }),
					expect.objectContaining({ name: 'count', type: 'number', optional: true }),
					expect.objectContaining({
						name: 'enabled',
						type: 'boolean',
						optional: true,
						defaultValue: 'true',
					}),
				])
			);
		});
	});

	test('PropsParser - parseComponentProps - parse type alias props', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('parseComponentProps Tests');
		await allure.tags(...sharedTags);

		await allure.step('Parse component props from source code', async () => {
			const source = `
				export type Props = {
					/** Foo string */
					foo: string;
					bar?: number;
				}
			`;
			const result = await runEffect(parser.parseComponentProps(source));
			expect(result).toHaveLength(1);
			expect(result[0].name).toBe('Props');
			expect(result[0].props).toEqual(
				expect.arrayContaining([
					expect.objectContaining({ name: 'foo', type: 'string', optional: false }),
					expect.objectContaining({ name: 'bar', type: 'number', optional: true }),
				])
			);
		});
	});

	test('PropsParser - extractPropsFromAstroFile - extract Props interface from Astro File', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('extractPropsFromAstroFile Tests');
		await allure.tags(...sharedTags);

		await allure.step('Extract Props interface from Astro File', async () => {
			const astro = `
---
export interface Props {
    /** Title */
    title: string;
}
const { title } = Astro.props;
---`;
			const result = await runEffect(parser.extractPropsFromAstroFile(astro));
			expect(result).toContain('interface Props');
			expect(result).toContain('title: string');
		});
	});

	test('PropsParser - extractPropsFromAstroFile - extract Props type alias from Astro File', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('extractPropsFromAstroFile Tests');
		await allure.tags(...sharedTags);

		await allure.step('Extract Props type alias from Astro File', async () => {
			const astro = `
---
export type Props = {
	/** Count */
	count: number;
}
const { count } = Astro.props;
---`;
			const result = await runEffect(parser.extractPropsFromAstroFile(astro));
			expect(result).toContain('type Props');
			expect(result).toContain('count: number');
		});
	});

	// TODO: Refactor registerComponentFromFile/PropsParser to NOT throw on no props, but register with empty props array
	// it makes more sense for the registry to handle this gracefully
	[
		{
			astro: '<h1>No frontmatter</h1>',
			errorMessage: /No frontmatter/,
		},
		{
			astro: '---\nconst foo = 1;\n---\n<h1>No Props</h1>',
			errorMessage: /No Props interface or type/,
		},
	].forEach(({ astro, errorMessage }) => {
		test('PropsParser - extractPropsFromAstroFile - error cases', async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('extractPropsFromAstroFile Error Tests');
			await allure.tags(...sharedTags);

			await allure.step('Extract Props from Astro File and expect error', async () => {
				const result = await runEffect(parser.extractPropsFromAstroFile(astro).pipe(Effect.either));
				expect(result._tag).toBe('Left');
				// @ts-expect-error
				expect(result.left).toBeInstanceOf(Error);
				// @ts-expect-error
				expect(result.left.message).toMatch(errorMessage);
			});
		});
	});
});
