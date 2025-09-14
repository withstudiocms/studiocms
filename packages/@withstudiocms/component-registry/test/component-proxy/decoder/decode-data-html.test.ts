import { describe, expect, it } from 'vitest';
import { htmlDecodeTree } from '../../../src/component-proxy/decoder/decode-data-html.js';

describe('htmlDecodeTree', () => {
	it('should be defined', () => {
		expect(htmlDecodeTree).toBeDefined();
	});

	it('should be an instance of Uint16Array', () => {
		expect(htmlDecodeTree).toBeInstanceOf(Uint16Array);
	});

	it('should have a non-zero length', () => {
		expect(htmlDecodeTree.length).toBeGreaterThan(0);
	});

	it('should contain only numbers', () => {
		for (let i = 0; i < htmlDecodeTree.length; i++) {
			expect(typeof htmlDecodeTree[i]).toBe('number');
		}
	});

	it('should have values in the valid Uint16 range', () => {
		for (let i = 0; i < htmlDecodeTree.length; i++) {
			expect(htmlDecodeTree[i]).toBeGreaterThanOrEqual(0);
			expect(htmlDecodeTree[i]).toBeLessThanOrEqual(0xffff);
		}
	});
});
