import { describe, expect, it } from 'vitest';
import {
	decodeCodePoint,
	fromCodePoint,
	replaceCodePoint,
} from '../../../src/component-proxy/decoder/decode-codepoint.js';

describe('decode-codepoint', () => {
	describe('fromCodePoint', () => {
		it('returns correct string for BMP code points', () => {
			expect(fromCodePoint(0x41)).toBe('A');
			expect(fromCodePoint(0x20ac)).toBe('€');
		});

		it('returns correct string for astral code points', () => {
			expect(fromCodePoint(0x1f600)).toBe('😀');
			expect(fromCodePoint(0x1d306)).toBe('𝌆');
		});

		it('returns correct string for multiple code points', () => {
			expect(fromCodePoint(0x41, 0x42, 0x43)).toBe('ABC');
		});
	});

	describe('replaceCodePoint', () => {
		it('returns replacement character for surrogate code points', () => {
			expect(replaceCodePoint(0xd800)).toBe(0xfffd);
			expect(replaceCodePoint(0xdfff)).toBe(0xfffd);
		});

		it('returns replacement character for code points above Unicode range', () => {
			expect(replaceCodePoint(0x110000)).toBe(0xfffd);
		});

		it('returns mapped value for C1 controls', () => {
			expect(replaceCodePoint(128)).toBe(8364); // €
			expect(replaceCodePoint(136)).toBe(710); // ˆ
			expect(replaceCodePoint(153)).toBe(8482); // ™
		});

		it('returns code point unchanged if not mapped or invalid', () => {
			expect(replaceCodePoint(0x41)).toBe(0x41);
			expect(replaceCodePoint(0x20ac)).toBe(0x20ac);
		});
	});

	describe('decodeCodePoint', () => {
		it('decodes mapped C1 control code points', () => {
			expect(decodeCodePoint(128)).toBe('€');
			expect(decodeCodePoint(136)).toBe('ˆ');
			expect(decodeCodePoint(153)).toBe('™');
		});

		it('decodes regular code points', () => {
			expect(decodeCodePoint(0x41)).toBe('A');
			expect(decodeCodePoint(0x20ac)).toBe('€');
		});

		it('returns replacement character for invalid code points', () => {
			expect(decodeCodePoint(0xd800)).toBe('�');
			expect(decodeCodePoint(0x110000)).toBe('�');
		});
	});
});
