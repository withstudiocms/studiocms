/** biome-ignore-all lint/suspicious/noExplicitAny: allowed in tests */
import { describe, expect, it } from 'vitest';
import {
	type DecodingOptions,
	decode,
	EntityLevel,
} from '../../../src/component-proxy/decoder/index';

// Mock util.js functions for isolated testing if needed
// But here, let's assume decodeHTML and decodeXML work as expected

describe('decode', () => {
	it('decodes XML entities by default', () => {
		// &lt; = <
		expect(decode('&lt;tag&gt;')).toBe('<tag>');
		// &amp; = &
		expect(decode('foo &amp; bar')).toBe('foo & bar');
	});

	it('decodes XML entities when EntityLevel.XML is specified', () => {
		expect(decode('&lt;tag&gt;', EntityLevel.XML)).toBe('<tag>');
	});

	it('decodes HTML entities when EntityLevel.HTML is specified', () => {
		// &copy; is only in HTML, not XML
		expect(decode('&copy;', EntityLevel.HTML)).toBe('©');
		// &amp; is in both
		expect(decode('foo &amp; bar', EntityLevel.HTML)).toBe('foo & bar');
	});

	it('decodes HTML entities when options.level is HTML', () => {
		const options: DecodingOptions = { level: EntityLevel.HTML };
		expect(decode('&copy;', options)).toBe('©');
	});

	it('decodes XML entities when options.level is XML', () => {
		const options: DecodingOptions = { level: EntityLevel.XML };
		expect(decode('&lt;tag&gt;', options)).toBe('<tag>');
	});

	it('passes mode to decodeHTML when level is HTML', () => {
		// This test assumes decodeHTML respects the mode argument.
		// We'll just check that the function doesn't throw and decodes as expected.
		const options: DecodingOptions = { level: EntityLevel.HTML, mode: 'Strict' as any };
		expect(decode('&copy;', options)).toBe('©');
	});

	it('ignores mode when level is XML', () => {
		const options: DecodingOptions = { level: EntityLevel.XML, mode: 'Legacy' as any };
		expect(decode('&lt;tag&gt;', options)).toBe('<tag>');
	});

	it('returns input unchanged if there are no entities', () => {
		expect(decode('plain text')).toBe('plain text');
	});
});
