import { Effect, runEffect } from '@withstudiocms/effect';
import { describe, expect, it } from 'vitest';
import { PropsParser } from '../../src/registry/PropsParser.js';

describe('PropsParser', async () => {
	const parser = await runEffect(PropsParser.pipe(Effect.provide(PropsParser.Default)));

	describe('parseComponentProps', () => {
		it('parses interface props with JSDoc', async () => {
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

		it('parses type alias props', async () => {
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

	describe('extractPropsFromAstroFile', () => {
		it('extracts Props interface from Astro frontmatter', async () => {
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

		it('extracts Props type alias from Astro frontmatter', async () => {
			const astro = `
---
export type Props = {
    foo: string;
}
---`;
			const result = await runEffect(parser.extractPropsFromAstroFile(astro));
			expect(result).toContain('type Props');
			expect(result).toContain('foo: string');
		});

		it('returns error if no frontmatter', async () => {
			const astro = '<h1>No frontmatter</h1>';
			const result = await runEffect(parser.extractPropsFromAstroFile(astro).pipe(Effect.either));
			expect(result._tag).toBe('Left');
			// @ts-expect-error
			expect(result.left).toBeInstanceOf(Error);
			// @ts-expect-error
			expect(result.left.message).toMatch(/No frontmatter/);
		});

		it('returns error if no Props found', async () => {
			const astro = '---\nconst foo = 1;\n---\n<h1>No Props</h1>';
			const result = await runEffect(parser.extractPropsFromAstroFile(astro).pipe(Effect.either));
			expect(result._tag).toBe('Left');
			// @ts-expect-error
			expect(result.left).toBeInstanceOf(Error);
			// @ts-expect-error
			expect(result.left.message).toMatch(/No Props interface or type/);
		});
	});
});
