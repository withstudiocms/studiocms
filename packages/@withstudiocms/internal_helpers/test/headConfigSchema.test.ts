import { describe, expect, it } from 'vitest';
import {
	createHead,
	type HeadConfig,
	HeadConfigSchema,
	type HeadUserConfig,
	hasTag,
	mergeHead,
	sortHead,
} from '../src/headConfigSchema.js';

const schema = HeadConfigSchema();

describe('headConfigSchema', () => {
	it('HeadConfigSchema parses valid config', () => {
		const input = [
			{ tag: 'title', attrs: {}, content: 'My Title' },
			{ tag: 'meta', attrs: { name: 'description', content: 'desc' }, content: '' },
		];
		const parsed = schema.parse(input);
		expect(parsed.length).toBe(2);
		expect(parsed[0].tag).toBe('title');
		expect(parsed[1].tag).toBe('meta');
	});

	it('HeadConfigSchema applies defaults', () => {
		const parsed = schema.parse(undefined);
		expect(parsed).toEqual([]);
		const parsed2 = schema.parse([{ tag: 'title', attrs: {} }]);
		expect(parsed2[0].content).toBe('');
	});

	it('createHead merges and sorts head configs', () => {
		const defaults: HeadUserConfig = [
			{ tag: 'meta', attrs: { charset: true }, content: '' },
			{ tag: 'title', attrs: {}, content: 'Default Title' },
			{ tag: 'meta', attrs: { name: 'description', content: 'desc1' }, content: '' },
		];
		const override: HeadConfig = [
			{ tag: 'title', attrs: {}, content: 'Override Title' },
			{ tag: 'meta', attrs: { name: 'description', content: 'desc2' }, content: '' },
			{ tag: 'meta', attrs: { name: 'viewport', content: 'width=device-width' }, content: '' },
		];
		const result = createHead(defaults, override);

		// Should have only one title and one description meta (from override)
		expect(result.some((t) => t.tag === 'title' && t.content === 'Override Title')).toBe(true);
		expect(
			result.some(
				(t) => t.tag === 'meta' && t.attrs.name === 'description' && t.attrs.content === 'desc2'
			)
		).toBe(true);
		// Should include important meta tags first (viewport, charset)
		const idxViewport = result.findIndex((t) => t.attrs.name === 'viewport');
		const idxCharset = result.findIndex((t) => t.attrs.charset === true);
		const idxTitle = result.findIndex((t) => t.tag === 'title');
		expect(idxViewport).toBeLessThan(idxTitle);
		expect(idxCharset).toBeLessThan(idxTitle);
	});

	it('hasTag detects existing title and meta', () => {
		const head: HeadConfig = [
			{ tag: 'title', attrs: {}, content: 'A' },
			{ tag: 'meta', attrs: { name: 'description', content: 'desc' }, content: '' },
		];
		expect(hasTag(head, { tag: 'title', attrs: {}, content: '' })).toBe(true);
		expect(
			hasTag(head, { tag: 'meta', attrs: { name: 'description', content: 'other' }, content: '' })
		).toBe(true);
		expect(
			hasTag(head, { tag: 'meta', attrs: { name: 'keywords', content: 'k' }, content: '' })
		).toBe(false);
	});

	it('mergeHead overwrites by new head', () => {
		const oldHead: HeadConfig = [
			{ tag: 'title', attrs: {}, content: 'Old' },
			{ tag: 'meta', attrs: { name: 'description', content: 'desc1' }, content: '' },
		];
		const newHead: HeadConfig = [
			{ tag: 'title', attrs: {}, content: 'New' },
			{ tag: 'meta', attrs: { name: 'description', content: 'desc2' }, content: '' },
		];
		const merged = mergeHead(oldHead, newHead);
		expect(merged.some((t) => t.content === 'New')).toBe(true);
		expect(merged.some((t) => t.attrs.content === 'desc2')).toBe(true);
		expect(merged.some((t) => t.content === 'Old')).toBe(false);
	});

	it('sortHead puts important tags first', () => {
		const head: HeadConfig = [
			{ tag: 'meta', attrs: { name: 'description', content: 'desc' }, content: '' },
			{ tag: 'title', attrs: {}, content: 'Title' },
			{ tag: 'meta', attrs: { charset: true }, content: '' },
			{ tag: 'link', attrs: { rel: 'shortcut icon', href: '/favicon.ico' }, content: '' },
			{ tag: 'meta', attrs: { name: 'viewport', content: 'width=device-width' }, content: '' },
		];
		const sorted = sortHead([...head] as HeadConfig);
		const idxCharset = sorted.findIndex((t) => t.attrs.charset === true);
		const idxViewport = sorted.findIndex((t) => t.attrs.name === 'viewport');
		const idxTitle = sorted.findIndex((t) => t.tag === 'title');
		const idxFavicon = sorted.findIndex((t) => t.tag === 'link');
		const idxDesc = sorted.findIndex((t) => t.attrs.name === 'description');
		expect(idxCharset).toBeLessThan(idxTitle);
		expect(idxViewport).toBeLessThan(idxTitle);
		expect(idxTitle).toBeLessThan(idxFavicon);
		expect(idxFavicon).toBeLessThan(idxDesc);
	});
});
