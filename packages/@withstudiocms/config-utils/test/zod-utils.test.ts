import { z } from 'astro/zod';
import { describe, expect, it } from 'vitest';
import { deepRemoveDefaults, parseAndMerge, parseConfig } from '../src/zod-utils.js';

// Helper: simple schema for most tests
const simpleSchema = z.object({
	foo: z.string(),
	bar: z.number().default(42),
	baz: z.boolean().optional(),
});

describe('Zod Utils', () => {
	describe('parseConfig', () => {
		it('parses valid config', () => {
			const result = parseConfig(simpleSchema, { foo: 'hello', bar: 1 });
			expect(result).toEqual({ foo: 'hello', bar: 1 });
		});

		it('applies default values', () => {
			const result = parseConfig(simpleSchema, { foo: 'hi' });
			expect(result).toEqual({ foo: 'hi', bar: 42 });
		});

		it('throws on invalid config', () => {
			expect(() => parseConfig(simpleSchema, { bar: 1 })).toThrow(/Invalid Configuration Options/);
		});
	});

	describe('deepRemoveDefaults', () => {
		it('removes defaults and makes fields optional', () => {
			const schema = z.object({
				a: z.string().default('x'),
				b: z.number(),
				c: z.object({
					d: z.boolean().default(true),
				}),
			});
			const noDefaults = deepRemoveDefaults(schema);
			expect(noDefaults.safeParse({}).success).toBe(true);
			expect(noDefaults.safeParse({ b: 2, c: { d: false } }).success).toBe(true);
		});

		it('handles arrays, optionals, nullables, and tuples', () => {
			const schema = z.object({
				arr: z.array(z.string().default('x')).default(['y']),
				opt: z.string().optional(),
				nul: z.number().nullable(),
				tup: z.tuple([z.string().default('a'), z.number()]),
			});
			const noDefaults = deepRemoveDefaults(schema);
			expect(noDefaults.safeParse({}).success).toBe(true);
			expect(noDefaults.safeParse({ arr: ['z'], tup: ['b', 2] }).success).toBe(true);
		});
	});

	describe('parseAndMerge', () => {
		it('merges inlineConfig and configFile, configFile takes precedence', () => {
			const schema = z.object({
				a: z.string().default('A'),
				b: z.number().default(1),
				c: z
					.object({
						d: z.boolean().default(false),
					})
					.default({ d: false }),
			});
			const inlineConfig = { a: 'inline', b: 2, c: { d: false } };
			const configFile = { a: 'file', c: { d: true } };
			const result = parseAndMerge(schema, inlineConfig, configFile);
			expect(result).toEqual({ a: 'file', b: 2, c: { d: true } });
		});

		it('returns inlineConfig if configFile is undefined', () => {
			const schema = z.object({
				a: z.string().default('A'),
				b: z.number().default(1),
				c: z
					.object({
						d: z.boolean().default(false),
					})
					.default({ d: false }),
			});
			const inlineConfig = { a: 'inline', b: 2, c: { d: true } };
			const result = parseAndMerge(schema, inlineConfig, undefined);
			expect(result).toEqual(inlineConfig);
		});

		it('returns schema defaults if both configs are undefined', () => {
			const schema = z.object({
				a: z.string().default('A'),
				b: z.number().default(1),
				c: z
					.object({
						d: z.boolean().default(false),
					})
					.default({ d: false }),
			});
			const result = parseAndMerge(schema, undefined, undefined);
			expect(result).toEqual({ a: 'A', b: 1, c: { d: false } });
		});

		it('throws on invalid configFile', () => {
			const schema = z.object({
				a: z.string().default('A'),
				b: z.number().default(1),
				c: z
					.object({
						d: z.boolean().default(false),
					})
					.default({ d: false }),
			});
			// @ts-expect-error - Testing invalid config
			expect(() => parseAndMerge(schema, undefined, { b: 'not-a-number' })).toThrow(
				/Invalid Config Options/
			);
		});
	});
});
