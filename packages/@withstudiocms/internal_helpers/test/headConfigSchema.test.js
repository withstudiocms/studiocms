import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
	createHead,
	HeadConfigSchema,
	hasTag,
	mergeHead,
	sortHead,
} from '../dist/headConfigSchema.js';

const schema = HeadConfigSchema();

describe('headConfigSchema', () => {
	test('HeadConfigSchema parses valid config', () => {
		const input = [
			{ tag: 'title', attrs: {}, content: 'My Title' },
			{ tag: 'meta', attrs: { name: 'description', content: 'desc' }, content: '' },
		];
		const parsed = schema.parse(input);
		assert.equal(parsed.length, 2);
		assert.equal(parsed[0].tag, 'title');
		assert.equal(parsed[1].tag, 'meta');
	});

	test('HeadConfigSchema applies defaults', () => {
		const parsed = schema.parse(undefined);
		assert.deepEqual(parsed, []);
		const parsed2 = schema.parse([{ tag: 'title', attrs: {} }]);
		assert.equal(parsed2[0].content, '');
	});

	test('createHead merges and sorts head configs', () => {
		const defaults = [
			{ tag: 'meta', attrs: { charset: true }, content: '' },
			{ tag: 'title', attrs: {}, content: 'Default Title' },
			{ tag: 'meta', attrs: { name: 'description', content: 'desc1' }, content: '' },
		];
		const override = [
			{ tag: 'title', attrs: {}, content: 'Override Title' },
			{ tag: 'meta', attrs: { name: 'description', content: 'desc2' }, content: '' },
			{ tag: 'meta', attrs: { name: 'viewport', content: 'width=device-width' }, content: '' },
		];
		const result = createHead(defaults, override);

		// Should have only one title and one description meta (from override)
		assert(result.some((t) => t.tag === 'title' && t.content === 'Override Title'));
		assert(
			result.some(
				(t) => t.tag === 'meta' && t.attrs.name === 'description' && t.attrs.content === 'desc2'
			)
		);
		// Should include important meta tags first (viewport, charset)
		const idxViewport = result.findIndex((t) => t.attrs.name === 'viewport');
		const idxCharset = result.findIndex((t) => t.attrs.charset === true);
		const idxTitle = result.findIndex((t) => t.tag === 'title');
		assert(idxViewport < idxTitle);
		assert(idxCharset < idxTitle);
	});

	test('hasTag detects existing title and meta', () => {
		const head = [
			{ tag: 'title', attrs: {}, content: 'A' },
			{ tag: 'meta', attrs: { name: 'description', content: 'desc' }, content: '' },
		];
		assert(hasTag(head, { tag: 'title', attrs: {}, content: '' }));
		assert(
			hasTag(head, { tag: 'meta', attrs: { name: 'description', content: 'other' }, content: '' })
		);
		assert(!hasTag(head, { tag: 'meta', attrs: { name: 'keywords', content: 'k' }, content: '' }));
	});

	test('mergeHead overwrites by new head', () => {
		const oldHead = [
			{ tag: 'title', attrs: {}, content: 'Old' },
			{ tag: 'meta', attrs: { name: 'description', content: 'desc1' }, content: '' },
		];
		const newHead = [
			{ tag: 'title', attrs: {}, content: 'New' },
			{ tag: 'meta', attrs: { name: 'description', content: 'desc2' }, content: '' },
		];
		const merged = mergeHead(oldHead, newHead);
		assert(merged.some((t) => t.content === 'New'));
		assert(merged.some((t) => t.attrs.content === 'desc2'));
		assert(!merged.some((t) => t.content === 'Old'));
	});

	test('sortHead puts important tags first', () => {
		const head = [
			{ tag: 'meta', attrs: { name: 'description', content: 'desc' }, content: '' },
			{ tag: 'title', attrs: {}, content: 'Title' },
			{ tag: 'meta', attrs: { charset: true }, content: '' },
			{ tag: 'link', attrs: { rel: 'shortcut icon', href: '/favicon.ico' }, content: '' },
			{ tag: 'meta', attrs: { name: 'viewport', content: 'width=device-width' }, content: '' },
		];
		const sorted = sortHead([...head]);
		const idxCharset = sorted.findIndex((t) => t.attrs.charset === true);
		const idxViewport = sorted.findIndex((t) => t.attrs.name === 'viewport');
		const idxTitle = sorted.findIndex((t) => t.tag === 'title');
		const idxFavicon = sorted.findIndex((t) => t.tag === 'link');
		const idxDesc = sorted.findIndex((t) => t.attrs.name === 'description');
		assert(idxCharset < idxTitle);
		assert(idxViewport < idxTitle);
		assert(idxTitle < idxFavicon);
		assert(idxFavicon < idxDesc);
	});
});
