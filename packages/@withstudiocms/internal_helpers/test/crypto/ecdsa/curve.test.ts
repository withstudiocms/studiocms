import { describe, expect, test } from 'vitest';
import { ECDSANamedCurve, ECDSAPoint } from '../../../src/crypto/ecdsa/curve.js';

describe('ECDSANamedCurve', () => {
	describe('ECDSANamedCurve.isOnCurve()', () => {
		test('Co-factor h > 1', () => {
			const curve = new ECDSANamedCurve(
				0xdb7c2abf62e35e668076bead208bn,
				0x6127c24c05f38a0aaaf65c0ef02cn,
				0x51def1815db5ed74fcc34c85d709n,
				0x4ba30ab5e892b4e1649dd0928643n,
				0xadcd46f5882e3747def36e956e97n,
				0x36df0aafd8b8d7597ca10520d04bn,
				4n,
				14,
				'1.3.132.0.7'
			);
			expect(
				curve.isOnCurve(
					new ECDSAPoint(0x4ba30ab5e892b4e1649dd0928643n, 0xadcd46f5882e3747def36e956e97n)
				)
			).toBe(true);
			expect(
				curve.isOnCurve(
					new ECDSAPoint(3442185213147111329368355265766312n, 3035790070451486434651648738331985n)
				)
			).toBe(false);
		});
	});
});
