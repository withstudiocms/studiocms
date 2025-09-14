import { describe, expect, it } from 'vitest';
import {
	decodeHTML,
	decodeHTMLAttribute,
	decodeHTMLStrict,
	decodeXML,
	determineBranch,
	fromCodePoint,
	htmlDecodeTree,
	replaceCodePoint,
} from '../../../src/component-proxy/decoder/util.js';

describe('decodeHTML', () => {
	it('decodes named HTML entities (legacy mode)', () => {
		expect(decodeHTML('foo &amp; bar')).toBe('foo & bar');
		expect(decodeHTML('2 &lt; 3 &gt; 1')).toBe('2 < 3 > 1');
		expect(decodeHTML('Euro: &euro;')).toBe('Euro: €');
	});

	it('decodes numeric HTML entities', () => {
		expect(decodeHTML('A&#65;B')).toBe('AAB');
		expect(decodeHTML('A&#x41;B')).toBe('AAB');
		expect(decodeHTML('Smile: &#128512;')).toBe('Smile: 😀');
	});

	it('handles incomplete or invalid entities gracefully', () => {
		expect(decodeHTML('foo &invalid bar')).toBe('foo &invalid bar');
		expect(decodeHTML('foo &amp bar')).toBe('foo & bar');
		expect(decodeHTML('foo & bar')).toBe('foo & bar');
	});

	it('supports DecodingMode.Legacy by default', () => {
		expect(decodeHTML('foo &amp bar')).toBe('foo & bar');
		expect(decodeHTML('foo &amp; bar')).toBe('foo & bar');
	});
});

describe('decodeHTMLStrict', () => {
	it('decodes only semicolon-terminated entities', () => {
		expect(decodeHTMLStrict('foo &amp; bar')).toBe('foo & bar');
		expect(decodeHTMLStrict('foo &amp bar')).toBe('foo &amp bar');
		expect(decodeHTMLStrict('foo &lt; bar')).toBe('foo < bar');
	});
});

describe('decodeHTMLAttribute', () => {
	it('decodes entities in attribute mode', () => {
		expect(decodeHTMLAttribute('Tom &amp; Jerry')).toBe('Tom & Jerry');
		expect(decodeHTMLAttribute('x &lt y')).toBe('x < y');
		expect(decodeHTMLAttribute('foo &amp bar')).toBe('foo & bar');
	});
});

describe('decodeXML', () => {
	it('decodes XML entities strictly', () => {
		expect(decodeXML('foo &amp; bar')).toBe('foo & bar');
		expect(decodeXML('foo &lt; bar')).toBe('foo < bar');
		expect(decodeXML('foo &amp bar')).toBe('foo &amp bar');
		expect(decodeXML('foo &unknown; bar')).toBe('foo &unknown; bar');
	});
});

describe('fromCodePoint', () => {
	it('returns string for valid code points', () => {
		expect(fromCodePoint(65)).toBe('A');
		expect(fromCodePoint(0x1f600)).toBe('😀');
	});
});

describe('replaceCodePoint', () => {
	it('returns replacement character for invalid code points', () => {
		expect(replaceCodePoint(0x110000)).toBe(0xfffd);
		expect(replaceCodePoint(-1)).toBe(-1);
	});
	it('returns code point for valid code points', () => {
		expect(replaceCodePoint(65)).toBe(65);
		expect(replaceCodePoint(0x1f600)).toBe(0x1f600);
	});
});

describe('determineBranch', () => {
	it('returns -1 for invalid branch', () => {
		expect(determineBranch(htmlDecodeTree, 0, 0, 9999)).toBe(-1);
	});
	it('returns a non -1 index for a valid branch (example: "a" -> 0x61) in the root', () => {
		const idx = determineBranch(htmlDecodeTree, htmlDecodeTree[0], 1, 0x61);
		expect(typeof idx).toBe('number');
		expect(idx).not.toBe(-1);
	});
});

describe('decodeHTML (edge cases)', () => {
	it('returns input if no entities present', () => {
		expect(decodeHTML('plain text')).toBe('plain text');
	});
	it('handles multiple entities', () => {
		expect(decodeHTML('&lt;&gt;&amp;')).toBe('<>&');
	});
	it('handles empty string', () => {
		expect(decodeHTML('')).toBe('');
	});
});
