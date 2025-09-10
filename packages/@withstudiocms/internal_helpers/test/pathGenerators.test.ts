import { describe, expect, it } from 'vitest';
import * as paths from '../src/pathGenerators.js';

describe('pathGenerators', () => {
	it('pathWithBase strips leading slash and prepends one', () => {
		expect(paths.pathWithBase('/foo/bar')).toBe('/foo/bar');
		expect(paths.pathWithBase('foo/bar')).toBe('/foo/bar');
		expect(paths.pathWithBase('/')).toBe('/');
		expect(paths.pathWithBase('')).toBe('/');
	});

	it('fileWithBase strips leading slash and prepends one', () => {
		expect(paths.fileWithBase('/file.txt')).toBe('/file.txt');
		expect(paths.fileWithBase('file.txt')).toBe('/file.txt');
		expect(paths.fileWithBase('/')).toBe('/');
		expect(paths.fileWithBase('')).toBe('/');
	});

	it('ensureLeadingSlash adds slash if missing', () => {
		expect(paths.ensureLeadingSlash('foo')).toBe('/foo');
		expect(paths.ensureLeadingSlash('/foo')).toBe('/foo');
		expect(paths.ensureLeadingSlash('')).toBe('/');
	});

	it('ensureTrailingSlash adds slash if missing', () => {
		expect(paths.ensureTrailingSlash('foo')).toBe('foo/');
		expect(paths.ensureTrailingSlash('foo/')).toBe('foo/');
		expect(paths.ensureTrailingSlash('')).toBe('/');
	});

	it('ensureLeadingAndTrailingSlashes adds both slashes', () => {
		expect(paths.ensureLeadingAndTrailingSlashes('foo')).toBe('/foo/');
		expect(paths.ensureLeadingAndTrailingSlashes('/foo')).toBe('/foo/');
		expect(paths.ensureLeadingAndTrailingSlashes('foo/')).toBe('/foo/');
		expect(paths.ensureLeadingAndTrailingSlashes('/foo/')).toBe('/foo/');
		expect(paths.ensureLeadingAndTrailingSlashes('')).toBe('/');
	});

	it('stripLeadingSlash removes leading slash', () => {
		expect(paths.stripLeadingSlash('/foo')).toBe('foo');
		expect(paths.stripLeadingSlash('foo')).toBe('foo');
		expect(paths.stripLeadingSlash('')).toBe('');
	});

	it('stripTrailingSlash removes trailing slash', () => {
		expect(paths.stripTrailingSlash('foo/')).toBe('foo');
		expect(paths.stripTrailingSlash('foo')).toBe('foo');
		expect(paths.stripTrailingSlash('')).toBe('');
	});

	it('stripLeadingAndTrailingSlashes removes both', () => {
		expect(paths.stripLeadingAndTrailingSlashes('/foo/')).toBe('foo');
		expect(paths.stripLeadingAndTrailingSlashes('foo/')).toBe('foo');
		expect(paths.stripLeadingAndTrailingSlashes('/foo')).toBe('foo');
		expect(paths.stripLeadingAndTrailingSlashes('foo')).toBe('foo');
		expect(paths.stripLeadingAndTrailingSlashes('')).toBe('');
	});

	it('stripHtmlExtension removes .html extension', () => {
		expect(paths.stripHtmlExtension('/foo/bar.html')).toBe('/foo/bar');
		expect(paths.stripHtmlExtension('/foo/bar/')).toBe('/foo/bar');
		expect(paths.stripHtmlExtension('/foo/bar')).toBe('/foo/bar');
		expect(paths.stripHtmlExtension('/foo/bar.html/')).toBe('/foo/bar');
	});

	it('ensureHtmlExtension adds .html if missing', () => {
		expect(paths.ensureHtmlExtension('/foo/bar')).toBe('/foo/bar.html');
		expect(paths.ensureHtmlExtension('foo/bar')).toBe('/foo/bar.html');
		expect(paths.ensureHtmlExtension('/foo/bar.html')).toBe('/foo/bar.html');
		expect(paths.ensureHtmlExtension('foo/bar.html')).toBe('/foo/bar.html');
		expect(paths.ensureHtmlExtension('')).toBe('/index.html');
	});
});
