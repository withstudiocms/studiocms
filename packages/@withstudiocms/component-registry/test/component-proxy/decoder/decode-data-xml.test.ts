import { describe, expect, it } from 'vitest';
import { xmlDecodeTree } from '../../../src/component-proxy/decoder/decode-data-xml.js';

describe('xmlDecodeTree', () => {
	it('should be a Uint16Array', () => {
		expect(xmlDecodeTree).toBeInstanceOf(Uint16Array);
	});

	it('should have the expected length', () => {
		// The length should match the number of characters in the string
		const expectedLength =
			'\u0200aglq\t\x15\x18\x1b\u026d\x0f\0\0\x12p;\u4026os;\u4027t;\u403et;\u403cuot;\u4022'
				.length;
		expect(xmlDecodeTree.length).toBe(expectedLength);
	});

	it('should contain the correct char codes', () => {
		const source =
			'\u0200aglq\t\x15\x18\x1b\u026d\x0f\0\0\x12p;\u4026os;\u4027t;\u403et;\u403cuot;\u4022';
		const expected = Array.from(source).map((c) => c.charCodeAt(0));
		expect(Array.from(xmlDecodeTree)).toEqual(expected);
	});
});
