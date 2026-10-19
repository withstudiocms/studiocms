import * as allure from 'allure-js-commons';
import { describe, expect, test } from 'vitest';
import { ECDSANamedCurve, ECDSAPoint } from '../../../src/crypto/ecdsa/curve.js';
import { parentSuiteName, sharedTags } from '../../test-utils.js';

const localSuiteName = 'crypto/ecdsa/curve';

describe(parentSuiteName, () => {
	test('ECDSANamedCurve.isOnCurve()', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('ECDSANamedCurve.isOnCurve()');
		await allure.tags(...sharedTags);

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

		await allure.step('returns true for a point on the curve (generator point)', async (ctx) => {
			expect(
				curve.isOnCurve(
					new ECDSAPoint(0x4ba30ab5e892b4e1649dd0928643n, 0xadcd46f5882e3747def36e956e97n)
				)
			).toBe(true);
			await ctx.parameter('curve OID', '1.3.132.0.7');
			await ctx.parameter('point x', '0x4ba30ab5e892b4e1649dd0928643');
			await ctx.parameter('point y', '0xadcd46f5882e3747def36e956e97');
		});

		await allure.step('returns false for a point not on the curve', async (ctx) => {
			expect(
				curve.isOnCurve(
					new ECDSAPoint(3442185213147111329368355265766312n, 3035790070451486434651648738331985n)
				)
			).toBe(false);
			await ctx.parameter('point x', String(3442185213147111329368355265766312n));
			await ctx.parameter('point y', String(3035790070451486434651648738331985n));
		});
	});
});
