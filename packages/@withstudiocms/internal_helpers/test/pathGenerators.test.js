import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import * as paths from '../dist/pathGenerators.js';

describe('pathGenerators', () => {
	test('pathWithBase strips leading slash and prepends one', () => {
		assert.equal(paths.pathWithBase('/foo/bar'), '/foo/bar');
		assert.equal(paths.pathWithBase('foo/bar'), '/foo/bar');
		assert.equal(paths.pathWithBase('/'), '/');
		assert.equal(paths.pathWithBase(''), '/');
	});

	test('fileWithBase strips leading slash and prepends one', () => {
		assert.equal(paths.fileWithBase('/file.txt'), '/file.txt');
		assert.equal(paths.fileWithBase('file.txt'), '/file.txt');
		assert.equal(paths.fileWithBase('/'), '/');
		assert.equal(paths.fileWithBase(''), '/');
	});

	test('ensureLeadingSlash adds slash if missing', () => {
		assert.equal(paths.ensureLeadingSlash('foo'), '/foo');
		assert.equal(paths.ensureLeadingSlash('/foo'), '/foo');
		assert.equal(paths.ensureLeadingSlash(''), '/');
	});

	test('ensureTrailingSlash adds slash if missing', () => {
		assert.equal(paths.ensureTrailingSlash('foo'), 'foo/');
		assert.equal(paths.ensureTrailingSlash('foo/'), 'foo/');
		assert.equal(paths.ensureTrailingSlash(''), '/');
	});

	test('ensureLeadingAndTrailingSlashes adds both slashes', () => {
		assert.equal(paths.ensureLeadingAndTrailingSlashes('foo'), '/foo/');
		assert.equal(paths.ensureLeadingAndTrailingSlashes('/foo'), '/foo/');
		assert.equal(paths.ensureLeadingAndTrailingSlashes('foo/'), '/foo/');
		assert.equal(paths.ensureLeadingAndTrailingSlashes('/foo/'), '/foo/');
		assert.equal(paths.ensureLeadingAndTrailingSlashes(''), '/');
	});

	test('stripLeadingSlash removes leading slash', () => {
		assert.equal(paths.stripLeadingSlash('/foo'), 'foo');
		assert.equal(paths.stripLeadingSlash('foo'), 'foo');
		assert.equal(paths.stripLeadingSlash(''), '');
	});

	test('stripTrailingSlash removes trailing slash', () => {
		assert.equal(paths.stripTrailingSlash('foo/'), 'foo');
		assert.equal(paths.stripTrailingSlash('foo'), 'foo');
		assert.equal(paths.stripTrailingSlash(''), '');
	});

	test('stripLeadingAndTrailingSlashes removes both', () => {
		assert.equal(paths.stripLeadingAndTrailingSlashes('/foo/'), 'foo');
		assert.equal(paths.stripLeadingAndTrailingSlashes('foo/'), 'foo');
		assert.equal(paths.stripLeadingAndTrailingSlashes('/foo'), 'foo');
		assert.equal(paths.stripLeadingAndTrailingSlashes('foo'), 'foo');
		assert.equal(paths.stripLeadingAndTrailingSlashes(''), '');
	});

	test('stripHtmlExtension removes .html extension', () => {
		assert.equal(paths.stripHtmlExtension('/foo/bar.html'), '/foo/bar');
		assert.equal(paths.stripHtmlExtension('/foo/bar/'), '/foo/bar');
		assert.equal(paths.stripHtmlExtension('/foo/bar'), '/foo/bar');
		assert.equal(paths.stripHtmlExtension('/foo/bar.html/'), '/foo/bar');
	});

	test('ensureHtmlExtension adds .html if missing', () => {
		assert.equal(paths.ensureHtmlExtension('/foo/bar'), '/foo/bar.html');
		assert.equal(paths.ensureHtmlExtension('foo/bar'), '/foo/bar.html');
		assert.equal(paths.ensureHtmlExtension('/foo/bar.html'), '/foo/bar.html');
		assert.equal(paths.ensureHtmlExtension('foo/bar.html'), '/foo/bar.html');
		assert.equal(paths.ensureHtmlExtension(''), '/index.html');
	});
});
