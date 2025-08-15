import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { z } from 'astro/zod';
import { deepRemoveDefaults, parseAndMerge, parseConfig } from '../dist/zod-utils.js';

// Helper: simple schema for most tests
const simpleSchema = z.object({
	foo: z.string(),
	bar: z.number().default(42),
	baz: z.boolean().optional(),
});

describe('Zod Utils', () => {
	describe('parseConfig', () => {
		it('parseConfig parses valid config', () => {
			const result = parseConfig(simpleSchema, { foo: 'hello', bar: 1 });
			assert.deepEqual(result, { foo: 'hello', bar: 1 });
		});

		it('parseConfig applies default values', () => {
			const result = parseConfig(simpleSchema, { foo: 'hi' });
			assert.deepEqual(result, { foo: 'hi', bar: 42 });
		});

		it('parseConfig throws on invalid config', () => {
			assert.throws(() => parseConfig(simpleSchema, { bar: 1 }), /Invalid Configuration Options/);
		});
	});

	describe('deepRemoveDefaults', () => {
		it('deepRemoveDefaults removes defaults and makes fields optional', () => {
			const schema = z.object({
				a: z.string().default('x'),
				b: z.number(),
				c: z.object({
					d: z.boolean().default(true),
				}),
			});
			const noDefaults = deepRemoveDefaults(schema);
			assert.deepEqual(noDefaults.safeParse({}).success, true);
			assert.deepEqual(noDefaults.safeParse({ b: 2, c: { d: false } }).success, true);
		});

		it('deepRemoveDefaults handles arrays, optionals, nullables, and tuples', () => {
			const schema = z.object({
				arr: z.array(z.string().default('x')).default(['y']),
				opt: z.string().optional(),
				nul: z.number().nullable(),
				tup: z.tuple([z.string().default('a'), z.number()]),
			});
			const noDefaults = deepRemoveDefaults(schema);
			assert.deepEqual(noDefaults.safeParse({}).success, true);
			assert.deepEqual(noDefaults.safeParse({ arr: ['z'], tup: ['b', 2] }).success, true);
		});
	});

	describe('parseAndMerge', () => {
		it('parseAndMerge merges inlineConfig and configFile, configFile takes precedence', () => {
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
			assert.deepEqual(result, { a: 'file', b: 2, c: { d: true } });
		});

		it('parseAndMerge returns inlineConfig if configFile is undefined', () => {
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
			assert.deepEqual(result, inlineConfig);
		});

		it('parseAndMerge returns schema defaults if both configs are undefined', () => {
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
			assert.deepEqual(result, { a: 'A', b: 1, c: { d: false } });
		});

		it('parseAndMerge throws on invalid configFile', () => {
			const schema = z.object({
				a: z.string().default('A'),
				b: z.number().default(1),
				c: z
					.object({
						d: z.boolean().default(false),
					})
					.default({ d: false }),
			});
			assert.throws(
				() => parseAndMerge(schema, undefined, { b: 'not-a-number' }),
				/Invalid Config Options/
			);
		});
	});
});
