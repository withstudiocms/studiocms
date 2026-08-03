import * as allure from 'allure-js-commons';
import { describe, expect, test } from 'vitest';
import {
	ASN1BitString,
	ASN1Boolean,
	ASN1Class,
	ASN1EncodableSequence,
	ASN1EncodableSet,
	ASN1Form,
	ASN1GeneralizedTime,
	ASN1IA5String,
	ASN1Integer,
	ASN1Null,
	ASN1NumericString,
	ASN1ObjectIdentifier,
	ASN1OctetString,
	ASN1PrintableString,
	ASN1RealBinaryEncoding,
	ASN1RealDecimalEncoding,
	ASN1RealZero,
	ASN1Sequence,
	ASN1Set,
	ASN1SpecialReal,
	ASN1UTCTime,
	ASN1UTF8String,
	ASN1Value,
	encodeASN1,
	encodeObjectIdentifier,
	parseASN1,
	RealBinaryEncodingBase,
	RealDecimalEncodingFormat,
	SpecialReal,
} from '../../src/asn1/asn1.js';
import { parentSuiteName, sharedTags } from '../test-utils.js';

const localSuiteName = 'asn1/asn1';

describe(parentSuiteName, () => {
	// ── parseASN1 ──────────────────────────────────────────────────────────────

	test('parseASN1()', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('parseASN1()');
		await allure.tags(...sharedTags);

		await allure.step('Universal Primitive tag 0', async (ctx) => {
			expect(parseASN1(new Uint8Array([0b00000000, 0x00]))).toStrictEqual([
				new ASN1Value(ASN1Class.Universal, ASN1Form.Primitive, 0, new Uint8Array()),
				2,
			]);
			await ctx.parameter('input', new Uint8Array([0b00000000, 0x00]).toString());
			await ctx.parameter('class', 'Universal');
			await ctx.parameter('form', 'Primitive');
		});

		await allure.step('Application Primitive tag 0', async (ctx) => {
			expect(parseASN1(new Uint8Array([0b01000000, 0x00]))).toStrictEqual([
				new ASN1Value(ASN1Class.Application, ASN1Form.Primitive, 0, new Uint8Array()),
				2,
			]);
			await ctx.parameter('input', new Uint8Array([0b01000000, 0x00]).toString());
			await ctx.parameter('class', 'Application');
		});

		await allure.step('ContextSpecific Primitive tag 0', async (ctx) => {
			expect(parseASN1(new Uint8Array([0b10000000, 0x00]))).toStrictEqual([
				new ASN1Value(ASN1Class.ContextSpecific, ASN1Form.Primitive, 0, new Uint8Array()),
				2,
			]);
			await ctx.parameter('input', new Uint8Array([0b10000000, 0x00]).toString());
			await ctx.parameter('class', 'ContextSpecific');
		});

		await allure.step('Private Primitive tag 0', async (ctx) => {
			expect(parseASN1(new Uint8Array([0b11000000, 0x00]))).toStrictEqual([
				new ASN1Value(ASN1Class.Private, ASN1Form.Primitive, 0, new Uint8Array()),
				2,
			]);
			await ctx.parameter('input', new Uint8Array([0b11000000, 0x00]).toString());
			await ctx.parameter('class', 'Private');
		});

		await allure.step('Universal Constructed tag 0', async (ctx) => {
			expect(parseASN1(new Uint8Array([0b00100000, 0x00]))).toStrictEqual([
				new ASN1Value(ASN1Class.Universal, ASN1Form.Constructed, 0, new Uint8Array()),
				2,
			]);
			await ctx.parameter('input', new Uint8Array([0b00100000, 0x00]).toString());
			await ctx.parameter('form', 'Constructed');
		});

		await allure.step('tag 1', async (ctx) => {
			expect(parseASN1(new Uint8Array([0x01, 0x00]))).toStrictEqual([
				new ASN1Value(ASN1Class.Universal, ASN1Form.Primitive, 1, new Uint8Array()),
				2,
			]);
			await ctx.parameter('tag', String(1));
		});

		await allure.step('tag 30 (max single-byte tag)', async (ctx) => {
			expect(parseASN1(new Uint8Array([0x1e, 0x00]))).toStrictEqual([
				new ASN1Value(ASN1Class.Universal, ASN1Form.Primitive, 30, new Uint8Array()),
				2,
			]);
			await ctx.parameter('tag', String(30));
		});

		await allure.step('tag 8192 (multi-byte long-form tag)', async (ctx) => {
			expect(parseASN1(new Uint8Array([0x1f, 0xc0, 0x00, 0x00]))).toStrictEqual([
				new ASN1Value(ASN1Class.Universal, ASN1Form.Primitive, 8192, new Uint8Array()),
				4,
			]);
			await ctx.parameter('tag', String(8192));
		});

		await allure.step('127-byte short-form length', async (ctx) => {
			expect(parseASN1(new Uint8Array([0x00, 0x7f, ...new Uint8Array(127)]))).toStrictEqual([
				new ASN1Value(ASN1Class.Universal, ASN1Form.Primitive, 0, new Uint8Array(127)),
				129,
			]);
			await ctx.parameter('length', String(127));
		});

		await allure.step('128-byte long-form length (1 length octet)', async (ctx) => {
			expect(parseASN1(new Uint8Array([0x00, 0x81, 0x80, ...new Uint8Array(128)]))).toStrictEqual([
				new ASN1Value(ASN1Class.Universal, ASN1Form.Primitive, 0, new Uint8Array(128)),
				131,
			]);
			await ctx.parameter('length', String(128));
		});

		await allure.step('256-byte long-form length (2 length octets)', async (ctx) => {
			expect(
				parseASN1(new Uint8Array([0x00, 0x82, 0x01, 0x00, ...new Uint8Array(256)]))
			).toStrictEqual([
				new ASN1Value(ASN1Class.Universal, ASN1Form.Primitive, 0, new Uint8Array(256)),
				256 + 4,
			]);
			await ctx.parameter('length', String(256));
		});
	});

	// ── encodeObjectIdentifier ─────────────────────────────────────────────────

	test('encodeObjectIdentifier()', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('encodeObjectIdentifier()');
		await allure.tags(...sharedTags);

		await allure.step("encodeObjectIdentifier('2.100.3')", async (ctx) => {
			expect(encodeObjectIdentifier('2.100.3')).toStrictEqual(new Uint8Array([0x81, 0x34, 0x03]));
			await ctx.parameter('input', '2.100.3');
			await ctx.parameter('expected', new Uint8Array([0x81, 0x34, 0x03]).toString());
		});

		await allure.step("encodeObjectIdentifier('1.2.840.10045.4.3.2')", async (ctx) => {
			expect(encodeObjectIdentifier('1.2.840.10045.4.3.2')).toStrictEqual(
				new Uint8Array([0x2a, 0x86, 0x48, 0xce, 0x3d, 0x04, 0x03, 0x02])
			);
			await ctx.parameter('input', '1.2.840.10045.4.3.2');
			await ctx.parameter(
				'expected',
				new Uint8Array([0x2a, 0x86, 0x48, 0xce, 0x3d, 0x04, 0x03, 0x02]).toString()
			);
		});
	});

	// ── encodeASN1 ─────────────────────────────────────────────────────────────

	test('encodeASN1()', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('encodeASN1()');
		await allure.tags(...sharedTags);

		await allure.step('Universal Primitive tag 0', async (ctx) => {
			expect(
				encodeASN1(new ASN1Value(ASN1Class.Universal, ASN1Form.Primitive, 0, new Uint8Array()))
			).toStrictEqual(new Uint8Array([0b00000000, 0x00]));
			await ctx.parameter('class', 'Universal');
			await ctx.parameter('form', 'Primitive');
			await ctx.parameter('tag', String(0));
		});

		await allure.step('Application Primitive tag 0', async (ctx) => {
			expect(
				encodeASN1(new ASN1Value(ASN1Class.Application, ASN1Form.Primitive, 0, new Uint8Array()))
			).toStrictEqual(new Uint8Array([0b01000000, 0x00]));
			await ctx.parameter('class', 'Application');
		});

		await allure.step('ContextSpecific Primitive tag 0', async (ctx) => {
			expect(
				encodeASN1(
					new ASN1Value(ASN1Class.ContextSpecific, ASN1Form.Primitive, 0, new Uint8Array())
				)
			).toStrictEqual(new Uint8Array([0b10000000, 0x00]));
			await ctx.parameter('class', 'ContextSpecific');
		});

		await allure.step('Private Primitive tag 0', async (ctx) => {
			expect(
				encodeASN1(new ASN1Value(ASN1Class.Private, ASN1Form.Primitive, 0, new Uint8Array()))
			).toStrictEqual(new Uint8Array([0b11000000, 0x00]));
			await ctx.parameter('class', 'Private');
		});

		await allure.step('Universal Constructed tag 0', async (ctx) => {
			expect(
				encodeASN1(new ASN1Value(ASN1Class.Universal, ASN1Form.Constructed, 0, new Uint8Array()))
			).toStrictEqual(new Uint8Array([0b00100000, 0x00]));
			await ctx.parameter('form', 'Constructed');
		});

		await allure.step('tag 1', async (ctx) => {
			expect(
				encodeASN1(new ASN1Value(ASN1Class.Universal, ASN1Form.Primitive, 1, new Uint8Array()))
			).toStrictEqual(new Uint8Array([0x01, 0x00]));
			await ctx.parameter('tag', String(1));
		});

		await allure.step('tag 30', async (ctx) => {
			expect(
				encodeASN1(new ASN1Value(ASN1Class.Universal, ASN1Form.Primitive, 30, new Uint8Array()))
			).toStrictEqual(new Uint8Array([0x1e, 0x00]));
			await ctx.parameter('tag', String(30));
		});

		await allure.step('tag 8192 (multi-byte long-form tag)', async (ctx) => {
			expect(
				encodeASN1(new ASN1Value(ASN1Class.Universal, ASN1Form.Primitive, 8192, new Uint8Array()))
			).toStrictEqual(new Uint8Array([0x1f, 0xc0, 0x00, 0x00]));
			await ctx.parameter('tag', String(8192));
		});

		await allure.step('127-byte short-form length', async (ctx) => {
			expect(
				encodeASN1(
					new ASN1Value(ASN1Class.Universal, ASN1Form.Primitive, 0, new Uint8Array(127))
				)
			).toStrictEqual(new Uint8Array([0x00, 0x7f, ...new Uint8Array(127)]));
			await ctx.parameter('contentLength', String(127));
		});

		await allure.step('128-byte long-form length (1 length octet)', async (ctx) => {
			expect(
				encodeASN1(
					new ASN1Value(ASN1Class.Universal, ASN1Form.Primitive, 0, new Uint8Array(128))
				)
			).toStrictEqual(new Uint8Array([0x00, 0x81, 0x80, ...new Uint8Array(128)]));
			await ctx.parameter('contentLength', String(128));
		});

		await allure.step('256-byte long-form length (2 length octets)', async (ctx) => {
			expect(
				encodeASN1(
					new ASN1Value(ASN1Class.Universal, ASN1Form.Primitive, 0, new Uint8Array(256))
				)
			).toStrictEqual(new Uint8Array([0x00, 0x82, 0x01, 0x00, ...new Uint8Array(256)]));
			await ctx.parameter('contentLength', String(256));
		});
	});

	// ── ASN1Value methods ──────────────────────────────────────────────────────

	test('ASN1Value.boolean()', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('ASN1Value.boolean()');
		await allure.tags(...sharedTags);

		await allure.step('ASN1Value.boolean()', async (ctx) => {
			expect(
				new ASN1Value(ASN1Class.Universal, ASN1Form.Primitive, 1, new Uint8Array([0xff])).boolean()
			).toStrictEqual(new ASN1Boolean(true));
			expect(
				new ASN1Value(ASN1Class.Universal, ASN1Form.Primitive, 1, new Uint8Array([0x00])).boolean()
			).toStrictEqual(new ASN1Boolean(false));
			await ctx.parameter('true byte', '0xff');
			await ctx.parameter('false byte', '0x00');
		});
	});

	test('ASN1Value.integer()', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('ASN1Value.integer()');
		await allure.tags(...sharedTags);

		await allure.step('ASN1Value.integer()', async (ctx) => {
			expect(
				new ASN1Value(ASN1Class.Universal, ASN1Form.Primitive, 2, new Uint8Array([0x00])).integer()
			).toStrictEqual(new ASN1Integer(0n));
			expect(
				new ASN1Value(ASN1Class.Universal, ASN1Form.Primitive, 2, new Uint8Array([0x01])).integer()
			).toStrictEqual(new ASN1Integer(1n));
			expect(
				new ASN1Value(
					ASN1Class.Universal,
					ASN1Form.Primitive,
					2,
					new Uint8Array([0x00, 0x80])
				).integer()
			).toStrictEqual(new ASN1Integer(128n));
			expect(
				new ASN1Value(
					ASN1Class.Universal,
					ASN1Form.Primitive,
					2,
					new Uint8Array([
						0x33, 0xff, 0x8e, 0xec, 0x07, 0x9c, 0x46, 0x65, 0x7a, 0x20, 0xb5, 0xd4, 0xb4, 0x7d, 0xf6,
						0xb0, 0x59, 0xca, 0x46, 0xb4, 0x4b, 0xfa, 0xae, 0x0d, 0x3b, 0xf6, 0x52, 0xf2,
					])
				).integer()
			).toStrictEqual(
				new ASN1Integer(5476057457410545405175640567415649081748931656501235026509713265394n)
			);
			expect(
				new ASN1Value(ASN1Class.Universal, ASN1Form.Primitive, 2, new Uint8Array([0xff])).integer()
			).toStrictEqual(new ASN1Integer(-1n));
			expect(
				new ASN1Value(
					ASN1Class.Universal,
					ASN1Form.Primitive,
					2,
					new Uint8Array([0xff, 0x7f])
				).integer()
			).toStrictEqual(new ASN1Integer(-129n));
			await ctx.parameter('cases', '0, 1, 128, large positive, -1, -129');
		});
	});

	test('ASN1Value.bitString()', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('ASN1Value.bitString()');
		await allure.tags(...sharedTags);

		await allure.step('empty bit string', async (ctx) => {
			expect(
				new ASN1Value(ASN1Class.Universal, ASN1Form.Primitive, 3, new Uint8Array([0x00])).bitString()
			).toStrictEqual(new ASN1BitString(new Uint8Array(), 0));
			await ctx.parameter('unused bits', String(0));
			await ctx.parameter('bytes', '');
		});

		await allure.step('7 unused bits', async (ctx) => {
			expect(
				new ASN1Value(
					ASN1Class.Universal,
					ASN1Form.Primitive,
					3,
					new Uint8Array([0x01, 0xff])
				).bitString()
			).toStrictEqual(new ASN1BitString(new Uint8Array([0xff]), 7));
			await ctx.parameter('unused bits', String(7));
			await ctx.parameter('bit count', String(7));
		});

		await allure.step('multi-byte bit string with 7 unused bits', async (ctx) => {
			expect(
				new ASN1Value(
					ASN1Class.Universal,
					ASN1Form.Primitive,
					3,
					new Uint8Array([0x07, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a])
				).bitString()
			).toStrictEqual(
				new ASN1BitString(
					new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a]),
					73
				)
			);
			await ctx.parameter('unused bits', String(7));
			await ctx.parameter('bit count', String(73));
		});
	});

	test('ASN1Value.octetString()', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('ASN1Value.octetString()');
		await allure.tags(...sharedTags);

		await allure.step('empty octet string', async () => {
			expect(
				new ASN1Value(ASN1Class.Universal, ASN1Form.Primitive, 4, new Uint8Array([])).octetString()
			).toStrictEqual(new ASN1OctetString(new Uint8Array()));
		});

		await allure.step('10-byte octet string', async (ctx) => {
			expect(
				new ASN1Value(
					ASN1Class.Universal,
					ASN1Form.Primitive,
					4,
					new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a])
				).octetString()
			).toStrictEqual(
				new ASN1OctetString(
					new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a])
				)
			);
			await ctx.parameter('length', String(10));
		});
	});

	test('ASN1Value.null()', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('ASN1Value.null()');
		await allure.tags(...sharedTags);

		await allure.step('ASN1Value.null()', async () => {
			expect(
				new ASN1Value(ASN1Class.Universal, ASN1Form.Primitive, 5, new Uint8Array()).null()
			).toStrictEqual(new ASN1Null());
		});
	});

	test('ASN1Value.objectIdentifier()', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('ASN1Value.objectIdentifier()');
		await allure.tags(...sharedTags);

		await allure.step('ASN1Value.objectIdentifier()', async (ctx) => {
			expect(
				new ASN1Value(
					ASN1Class.Universal,
					ASN1Form.Primitive,
					6,
					new Uint8Array([0x2a, 0x86, 0x48, 0xce, 0x3d, 0x04, 0x03, 0x02])
				).objectIdentifier()
			).toStrictEqual(
				new ASN1ObjectIdentifier(new Uint8Array([0x2a, 0x86, 0x48, 0xce, 0x3d, 0x04, 0x03, 0x02]))
			);
			await ctx.parameter(
				'oid bytes',
				new Uint8Array([0x2a, 0x86, 0x48, 0xce, 0x3d, 0x04, 0x03, 0x02]).toString()
			);
		});
	});

	test('ASN1Value.real() - Zero', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('ASN1Value.real()');
		await allure.tags(...sharedTags);

		await allure.step('Zero', async () => {
			expect(
				new ASN1Value(ASN1Class.Universal, ASN1Form.Primitive, 9, new Uint8Array()).real()
			).toStrictEqual(new ASN1RealZero());
		});
	});

	test('ASN1Value.real() - Special()', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('ASN1Value.real()');
		await allure.tags(...sharedTags);

		await allure.step('PlusInfinity', async (ctx) => {
			expect(
				new ASN1Value(ASN1Class.Universal, ASN1Form.Primitive, 9, new Uint8Array([0x40])).real()
			).toStrictEqual(new ASN1SpecialReal(SpecialReal.PlusInfinity));
			await ctx.parameter('byte', '0x40');
			await ctx.parameter('special', 'PlusInfinity');
		});

		await allure.step('MinusInfinity', async (ctx) => {
			expect(
				new ASN1Value(ASN1Class.Universal, ASN1Form.Primitive, 9, new Uint8Array([0x41])).real()
			).toStrictEqual(new ASN1SpecialReal(SpecialReal.MinusInfinity));
			await ctx.parameter('byte', '0x41');
			await ctx.parameter('special', 'MinusInfinity');
		});
	});

	test('ASN1Value.real() - Binary encoding', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('ASN1Value.real()');
		await allure.tags(...sharedTags);

		await allure.step('Base2, positive mantissa, 1-byte exponent', async (ctx) => {
			expect(
				new ASN1Value(
					ASN1Class.Universal,
					ASN1Form.Primitive,
					9,
					new Uint8Array([0b10001100, 0x05, 0x04])
				).real()
			).toStrictEqual(new ASN1RealBinaryEncoding(32n, RealBinaryEncodingBase.Base2, 5n));
			await ctx.parameter('base', 'Base2');
			await ctx.parameter('mantissa', String(32n));
			await ctx.parameter('exponent', String(5n));
		});

		await allure.step('Base8, positive mantissa, 1-byte exponent', async (ctx) => {
			expect(
				new ASN1Value(
					ASN1Class.Universal,
					ASN1Form.Primitive,
					9,
					new Uint8Array([0b10011100, 0x05, 0x04])
				).real()
			).toStrictEqual(new ASN1RealBinaryEncoding(32n, RealBinaryEncodingBase.Base8, 5n));
			await ctx.parameter('base', 'Base8');
		});

		await allure.step('Base16, positive mantissa, 1-byte exponent', async (ctx) => {
			expect(
				new ASN1Value(
					ASN1Class.Universal,
					ASN1Form.Primitive,
					9,
					new Uint8Array([0b10101100, 0x05, 0x04])
				).real()
			).toStrictEqual(new ASN1RealBinaryEncoding(32n, RealBinaryEncodingBase.Base16, 5n));
			await ctx.parameter('base', 'Base16');
		});

		await allure.step('Base2, negative mantissa', async (ctx) => {
			expect(
				new ASN1Value(
					ASN1Class.Universal,
					ASN1Form.Primitive,
					9,
					new Uint8Array([0b11001100, 0x05, 0x04])
				).real()
			).toStrictEqual(new ASN1RealBinaryEncoding(-32n, RealBinaryEncodingBase.Base2, 5n));
			await ctx.parameter('mantissa', String(-32n));
		});

		await allure.step('Base2, large 2-byte mantissa', async (ctx) => {
			expect(
				new ASN1Value(
					ASN1Class.Universal,
					ASN1Form.Primitive,
					9,
					new Uint8Array([0b10001100, 0x05, 0x7f, 0xff])
				).real()
			).toStrictEqual(new ASN1RealBinaryEncoding(262136n, RealBinaryEncodingBase.Base2, 5n));
			await ctx.parameter('mantissa', String(262136n));
		});

		await allure.step('Base2, 2-byte positive exponent', async (ctx) => {
			expect(
				new ASN1Value(
					ASN1Class.Universal,
					ASN1Form.Primitive,
					9,
					new Uint8Array([0b10001101, 0x00, 0x80, 0x04])
				).real()
			).toStrictEqual(new ASN1RealBinaryEncoding(32n, RealBinaryEncodingBase.Base2, 128n));
			await ctx.parameter('exponent', String(128n));
		});

		await allure.step('Base2, 2-byte negative exponent', async (ctx) => {
			expect(
				new ASN1Value(
					ASN1Class.Universal,
					ASN1Form.Primitive,
					9,
					new Uint8Array([0b10001101, 0xff, 0x7f, 0x04])
				).real()
			).toStrictEqual(new ASN1RealBinaryEncoding(32n, RealBinaryEncodingBase.Base2, -129n));
			await ctx.parameter('exponent', String(-129n));
		});

		await allure.step('Base2, 3-byte exponent', async (ctx) => {
			expect(
				new ASN1Value(
					ASN1Class.Universal,
					ASN1Form.Primitive,
					9,
					new Uint8Array([0b10001110, 0x00, 0x80, 0x00, 0x04])
				).real()
			).toStrictEqual(new ASN1RealBinaryEncoding(32n, RealBinaryEncodingBase.Base2, 32768n));
			await ctx.parameter('exponent', String(32768n));
		});

		await allure.step('Base2, 4-byte exponent', async (ctx) => {
			expect(
				new ASN1Value(
					ASN1Class.Universal,
					ASN1Form.Primitive,
					9,
					new Uint8Array([0b10001111, 0x04, 0x00, 0x80, 0x00, 0x00, 0x04])
				).real()
			).toStrictEqual(new ASN1RealBinaryEncoding(32n, RealBinaryEncodingBase.Base2, 8388608n));
			await ctx.parameter('exponent', String(8388608n));
		});
	});

	test('ASN1Value.real() - Decimal encoding', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('ASN1Value.real()');
		await allure.tags(...sharedTags);

		await allure.step('ISO6093NR1', async (ctx) => {
			expect(
				new ASN1Value(
					ASN1Class.Universal,
					ASN1Form.Primitive,
					9,
					new Uint8Array([0x01, 0xff])
				).real()
			).toStrictEqual(
				new ASN1RealDecimalEncoding(RealDecimalEncodingFormat.ISO6093NR1, new Uint8Array([0xff]))
			);
			await ctx.parameter('format', 'ISO6093NR1');
		});

		await allure.step('ISO6093NR2', async (ctx) => {
			expect(
				new ASN1Value(
					ASN1Class.Universal,
					ASN1Form.Primitive,
					9,
					new Uint8Array([0x02, 0xff])
				).real()
			).toStrictEqual(
				new ASN1RealDecimalEncoding(RealDecimalEncodingFormat.ISO6093NR2, new Uint8Array([0xff]))
			);
			await ctx.parameter('format', 'ISO6093NR2');
		});

		await allure.step('ISO6093NR3', async (ctx) => {
			expect(
				new ASN1Value(
					ASN1Class.Universal,
					ASN1Form.Primitive,
					9,
					new Uint8Array([0x03, 0xff])
				).real()
			).toStrictEqual(
				new ASN1RealDecimalEncoding(RealDecimalEncodingFormat.ISO6093NR3, new Uint8Array([0xff]))
			);
			await ctx.parameter('format', 'ISO6093NR3');
		});
	});

	test('ASN1Value.sequence()', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('ASN1Value.sequence()');
		await allure.tags(...sharedTags);

		await allure.step('ASN1Value.sequence()', async (ctx) => {
			expect(
				new ASN1Value(
					ASN1Class.Universal,
					ASN1Form.Constructed,
					16,
					new Uint8Array([0x01, 0x01, 0xff, 0x01, 0x01, 0x00, 0x01, 0x01, 0xff])
				).sequence()
			).toStrictEqual(
				new ASN1Sequence([
					new ASN1Value(ASN1Class.Universal, ASN1Form.Primitive, 1, new Uint8Array([0xff])),
					new ASN1Value(ASN1Class.Universal, ASN1Form.Primitive, 1, new Uint8Array([0x00])),
					new ASN1Value(ASN1Class.Universal, ASN1Form.Primitive, 1, new Uint8Array([0xff])),
				])
			);
			await ctx.parameter('element count', String(3));
		});
	});

	test('ASN1Value.set()', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('ASN1Value.set()');
		await allure.tags(...sharedTags);

		await allure.step('ASN1Value.set()', async (ctx) => {
			expect(
				new ASN1Value(
					ASN1Class.Universal,
					ASN1Form.Constructed,
					17,
					new Uint8Array([0x01, 0x01, 0xff, 0x01, 0x01, 0x00, 0x01, 0x01, 0xff])
				).set()
			).toStrictEqual(
				new ASN1Set([
					new ASN1Value(ASN1Class.Universal, ASN1Form.Primitive, 1, new Uint8Array([0xff])),
					new ASN1Value(ASN1Class.Universal, ASN1Form.Primitive, 1, new Uint8Array([0x00])),
					new ASN1Value(ASN1Class.Universal, ASN1Form.Primitive, 1, new Uint8Array([0xff])),
				])
			);
			await ctx.parameter('element count', String(3));
		});
	});

	test('ASN1Value.utf8String()', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('ASN1Value.utf8String()');
		await allure.tags(...sharedTags);

		await allure.step('ASN1Value.utf8String()', async (ctx) => {
			expect(
				new ASN1Value(
					ASN1Class.Universal,
					ASN1Form.Primitive,
					12,
					new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x05])
				).utf8String()
			).toStrictEqual(new ASN1UTF8String(new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x05])));
			await ctx.parameter('bytes', new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x05]).toString());
		});
	});

	test('ASN1Value.ia5String()', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('ASN1Value.ia5String()');
		await allure.tags(...sharedTags);

		await allure.step('ASN1Value.ia5String()', async (ctx) => {
			expect(
				new ASN1Value(
					ASN1Class.Universal,
					ASN1Form.Primitive,
					22,
					new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x05])
				).ia5String()
			).toStrictEqual(new ASN1IA5String(new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x05])));
			await ctx.parameter('bytes', new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x05]).toString());
		});
	});

	test('ASN1Value.printableString()', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('ASN1Value.printableString()');
		await allure.tags(...sharedTags);

		await allure.step('ASN1Value.printableString()', async (ctx) => {
			expect(
				new ASN1Value(
					ASN1Class.Universal,
					ASN1Form.Primitive,
					19,
					new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x05])
				).printableString()
			).toStrictEqual(new ASN1PrintableString(new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x05])));
			await ctx.parameter('bytes', new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x05]).toString());
		});
	});

	test('ASN1Value.numericString()', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('ASN1Value.numericString()');
		await allure.tags(...sharedTags);

		await allure.step('ASN1Value.numericString()', async (ctx) => {
			expect(
				new ASN1Value(
					ASN1Class.Universal,
					ASN1Form.Primitive,
					18,
					new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x05])
				).numericString()
			).toStrictEqual(new ASN1NumericString(new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x05])));
			await ctx.parameter('bytes', new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x05]).toString());
		});
	});

	test('ASN1Value.generalizedTime()', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('ASN1Value.generalizedTime()');
		await allure.tags(...sharedTags);

		await allure.step('without milliseconds', async (ctx) => {
			expect(
				new ASN1Value(
					ASN1Class.Universal,
					ASN1Form.Primitive,
					24,
					new Uint8Array([
						0x32, 0x30, 0x30, 0x30, 0x31, 0x32, 0x33, 0x31, 0x31, 0x30, 0x34, 0x30, 0x35, 0x34,
						0x5a,
					])
				).generalizedTime()
			).toStrictEqual(new ASN1GeneralizedTime(2000, 12, 31, 10, 40, 54, 0));
			await ctx.parameter('datetime', '2000-12-31T10:40:54Z');
			await ctx.parameter('milliseconds', String(0));
		});

		await allure.step('with milliseconds', async (ctx) => {
			expect(
				new ASN1Value(
					ASN1Class.Universal,
					ASN1Form.Primitive,
					24,
					new Uint8Array([
						0x32, 0x30, 0x30, 0x30, 0x31, 0x32, 0x33, 0x31, 0x31, 0x30, 0x34, 0x30, 0x35, 0x34,
						0x2e, 0x31, 0x31, 0x31, 0x5a,
					])
				).generalizedTime()
			).toStrictEqual(new ASN1GeneralizedTime(2000, 12, 31, 10, 40, 54, 111));
			await ctx.parameter('datetime', '2000-12-31T10:40:54.111Z');
			await ctx.parameter('milliseconds', String(111));
		});
	});

	test('ASN1Value.utcTime()', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('ASN1Value.utcTime()');
		await allure.tags(...sharedTags);

		await allure.step('ASN1Value.utcTime()', async (ctx) => {
			expect(
				new ASN1Value(
					ASN1Class.Universal,
					ASN1Form.Primitive,
					23,
					new Uint8Array([
						0x30, 0x30, 0x31, 0x32, 0x33, 0x31, 0x31, 0x30, 0x34, 0x30, 0x35, 0x34, 0x5a,
					])
				).utcTime()
			).toStrictEqual(new ASN1UTCTime(0, 12, 31, 10, 40, 54));
			await ctx.parameter('datetime', '00-12-31T10:40:54Z');
		});
	});

	// ── ASN1 class contents() methods ─────────────────────────────────────────

	test('ASN1Boolean.contents()', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('ASN1Boolean.contents()');
		await allure.tags(...sharedTags);

		await allure.step('ASN1Boolean.contents()', async (ctx) => {
			expect(new ASN1Boolean(true).contents()).toStrictEqual(new Uint8Array([0xff]));
			expect(new ASN1Boolean(false).contents()).toStrictEqual(new Uint8Array([0x00]));
			await ctx.parameter('true', '0xff');
			await ctx.parameter('false', '0x00');
		});
	});

	test('ASN1Integer.contents()', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('ASN1Integer.contents()');
		await allure.tags(...sharedTags);

		await allure.step('ASN1Integer.contents()', async (ctx) => {
			expect(new ASN1Integer(0n).contents()).toStrictEqual(new Uint8Array([0x00]));
			expect(new ASN1Integer(1n).contents()).toStrictEqual(new Uint8Array([0x01]));
			expect(new ASN1Integer(128n).contents()).toStrictEqual(new Uint8Array([0x00, 0x80]));
			expect(
				new ASN1Integer(
					5476057457410545405175640567415649081748931656501235026509713265394n
				).contents()
			).toStrictEqual(
				new Uint8Array([
					0x33, 0xff, 0x8e, 0xec, 0x07, 0x9c, 0x46, 0x65, 0x7a, 0x20, 0xb5, 0xd4, 0xb4, 0x7d, 0xf6,
					0xb0, 0x59, 0xca, 0x46, 0xb4, 0x4b, 0xfa, 0xae, 0x0d, 0x3b, 0xf6, 0x52, 0xf2,
				])
			);
			expect(new ASN1Integer(-1n).contents()).toStrictEqual(new Uint8Array([0xff]));
			expect(new ASN1Integer(-129n).contents()).toStrictEqual(new Uint8Array([0xff, 0x7f]));
			await ctx.parameter('cases', '0, 1, 128, large positive, -1, -129');
		});
	});

	test('ASN1BitString.contents()', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('ASN1BitString.contents()');
		await allure.tags(...sharedTags);

		await allure.step('empty (0 unused bits)', async (ctx) => {
			expect(new ASN1BitString(new Uint8Array(), 0).contents()).toStrictEqual(
				new Uint8Array([0x00])
			);
			await ctx.parameter('bit count', String(0));
		});

		await allure.step('1 byte, 7 unused bits', async (ctx) => {
			expect(new ASN1BitString(new Uint8Array([0xff]), 7).contents()).toStrictEqual(
				new Uint8Array([0x01, 0xff])
			);
			await ctx.parameter('bit count', String(7));
		});

		await allure.step('10 bytes, 73-bit count', async (ctx) => {
			expect(
				new ASN1BitString(
					new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a]),
					73
				).contents()
			).toStrictEqual(
				new Uint8Array([0x07, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a])
			);
			await ctx.parameter('bit count', String(73));
		});
	});

	test('ASN1OctetString.contents()', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('ASN1OctetString.contents()');
		await allure.tags(...sharedTags);

		await allure.step('empty', async () => {
			expect(new ASN1OctetString(new Uint8Array()).contents()).toStrictEqual(new Uint8Array());
		});

		await allure.step('10-byte string', async (ctx) => {
			expect(
				new ASN1OctetString(
					new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a])
				).contents()
			).toStrictEqual(new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a]));
			await ctx.parameter('length', String(10));
		});
	});

	test('ASN1Null.contents()', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('ASN1Null.contents()');
		await allure.tags(...sharedTags);

		await allure.step('ASN1Null.contents()', async () => {
			expect(new ASN1Null().contents()).toStrictEqual(new Uint8Array());
		});
	});

	test('ASN1ObjectIdentifier.contents()', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('ASN1ObjectIdentifier.contents()');
		await allure.tags(...sharedTags);

		await allure.step('ASN1ObjectIdentifier.contents()', async (ctx) => {
			expect(
				new ASN1ObjectIdentifier(
					new Uint8Array([0x2a, 0x86, 0x48, 0xce, 0x3d, 0x04, 0x03, 0x02])
				).contents()
			).toStrictEqual(new Uint8Array([0x2a, 0x86, 0x48, 0xce, 0x3d, 0x04, 0x03, 0x02]));
			await ctx.parameter(
				'oid bytes',
				new Uint8Array([0x2a, 0x86, 0x48, 0xce, 0x3d, 0x04, 0x03, 0x02]).toString()
			);
		});
	});

	test('ASN1RealZero.contents()', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('ASN1RealZero.contents()');
		await allure.tags(...sharedTags);

		await allure.step('ASN1RealZero.contents()', async () => {
			expect(new ASN1RealZero().contents()).toStrictEqual(new Uint8Array());
		});
	});

	test('ASN1SpecialReal.contents()', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('ASN1SpecialReal.contents()');
		await allure.tags(...sharedTags);

		await allure.step('PlusInfinity', async (ctx) => {
			expect(new ASN1SpecialReal(SpecialReal.PlusInfinity).contents()).toStrictEqual(
				new Uint8Array([0x40])
			);
			await ctx.parameter('special', 'PlusInfinity');
			await ctx.parameter('expected byte', '0x40');
		});

		await allure.step('MinusInfinity', async (ctx) => {
			expect(new ASN1SpecialReal(SpecialReal.MinusInfinity).contents()).toStrictEqual(
				new Uint8Array([0x41])
			);
			await ctx.parameter('special', 'MinusInfinity');
			await ctx.parameter('expected byte', '0x41');
		});
	});

	test('ASN1RealBinaryEncoding.contents()', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('ASN1RealBinaryEncoding.contents()');
		await allure.tags(...sharedTags);

		await allure.step('Base2, mantissa=32, exponent=5', async (ctx) => {
			expect(
				new ASN1RealBinaryEncoding(32n, RealBinaryEncodingBase.Base2, 5n).contents()
			).toStrictEqual(new Uint8Array([0b10001100, 0x05, 0x04]));
			await ctx.parameter('base', 'Base2');
			await ctx.parameter('mantissa', String(32n));
			await ctx.parameter('exponent', String(5n));
		});

		await allure.step('Base8, mantissa=32, exponent=5', async (ctx) => {
			expect(
				new ASN1RealBinaryEncoding(32n, RealBinaryEncodingBase.Base8, 5n).contents()
			).toStrictEqual(new Uint8Array([0b10011100, 0x05, 0x04]));
			await ctx.parameter('base', 'Base8');
		});

		await allure.step('Base16, mantissa=32, exponent=5', async (ctx) => {
			expect(
				new ASN1RealBinaryEncoding(32n, RealBinaryEncodingBase.Base16, 5n).contents()
			).toStrictEqual(new Uint8Array([0b10101100, 0x05, 0x04]));
			await ctx.parameter('base', 'Base16');
		});

		await allure.step('Base2, negative mantissa=-32, exponent=5', async (ctx) => {
			expect(
				new ASN1RealBinaryEncoding(-32n, RealBinaryEncodingBase.Base2, 5n).contents()
			).toStrictEqual(new Uint8Array([0b11001100, 0x05, 0x04]));
			await ctx.parameter('mantissa', String(-32n));
		});

		await allure.step('Base2, large mantissa=262136', async (ctx) => {
			expect(
				new ASN1RealBinaryEncoding(262136n, RealBinaryEncodingBase.Base2, 5n).contents()
			).toStrictEqual(new Uint8Array([0b10001100, 0x05, 0x7f, 0xff]));
			await ctx.parameter('mantissa', String(262136n));
		});

		await allure.step('Base2, 2-byte positive exponent=128', async (ctx) => {
			expect(
				new ASN1RealBinaryEncoding(32n, RealBinaryEncodingBase.Base2, 128n).contents()
			).toStrictEqual(new Uint8Array([0b10001101, 0x00, 0x80, 0x04]));
			await ctx.parameter('exponent', String(128n));
		});

		await allure.step('Base2, 2-byte negative exponent=-129', async (ctx) => {
			expect(
				new ASN1RealBinaryEncoding(32n, RealBinaryEncodingBase.Base2, -129n).contents()
			).toStrictEqual(new Uint8Array([0b10001101, 0xff, 0x7f, 0x04]));
			await ctx.parameter('exponent', String(-129n));
		});

		await allure.step('Base2, 3-byte exponent=32768', async (ctx) => {
			expect(
				new ASN1RealBinaryEncoding(32n, RealBinaryEncodingBase.Base2, 32768n).contents()
			).toStrictEqual(new Uint8Array([0b10001110, 0x00, 0x80, 0x00, 0x04]));
			await ctx.parameter('exponent', String(32768n));
		});

		await allure.step('Base2, 4-byte exponent=8388608', async (ctx) => {
			expect(
				new ASN1RealBinaryEncoding(32n, RealBinaryEncodingBase.Base2, 8388608n).contents()
			).toStrictEqual(new Uint8Array([0b10001111, 0x04, 0x00, 0x80, 0x00, 0x00, 0x04]));
			await ctx.parameter('exponent', String(8388608n));
		});
	});

	test('ASN1RealDecimalEncoding.contents()', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('ASN1RealDecimalEncoding.contents()');
		await allure.tags(...sharedTags);

		await allure.step('ISO6093NR1', async (ctx) => {
			expect(
				new ASN1RealDecimalEncoding(
					RealDecimalEncodingFormat.ISO6093NR1,
					new Uint8Array([0xff])
				).contents()
			).toStrictEqual(new Uint8Array([0x01, 0xff]));
			await ctx.parameter('format', 'ISO6093NR1');
		});

		await allure.step('ISO6093NR2', async (ctx) => {
			expect(
				new ASN1RealDecimalEncoding(
					RealDecimalEncodingFormat.ISO6093NR2,
					new Uint8Array([0xff])
				).contents()
			).toStrictEqual(new Uint8Array([0x02, 0xff]));
			await ctx.parameter('format', 'ISO6093NR2');
		});

		await allure.step('ISO6093NR3', async (ctx) => {
			expect(
				new ASN1RealDecimalEncoding(
					RealDecimalEncodingFormat.ISO6093NR3,
					new Uint8Array([0xff])
				).contents()
			).toStrictEqual(new Uint8Array([0x03, 0xff]));
			await ctx.parameter('format', 'ISO6093NR3');
		});
	});

	test('ASN1Sequence.isSequenceOfSingleType()', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('ASN1Sequence.isSequenceOfSingleType()');
		await allure.tags(...sharedTags);

		await allure.step('returns true when all elements share the same type', async () => {
			expect(
				new ASN1Sequence([
					new ASN1Value(ASN1Class.Universal, ASN1Form.Primitive, 1, new Uint8Array([0x00])),
					new ASN1Value(ASN1Class.Universal, ASN1Form.Primitive, 1, new Uint8Array([0xff])),
				]).isSequenceOfSingleType(ASN1Class.Universal, ASN1Form.Primitive, 1)
			).toBe(true);
		});

		await allure.step('returns false when elements have differing tags', async () => {
			expect(
				new ASN1Sequence([
					new ASN1Value(ASN1Class.Universal, ASN1Form.Primitive, 1, new Uint8Array([0x00])),
					new ASN1Value(ASN1Class.Universal, ASN1Form.Primitive, 2, new Uint8Array([0x01])),
				]).isSequenceOfSingleType(ASN1Class.Universal, ASN1Form.Primitive, 1)
			).toBe(false);
		});
	});

	test('ASN1EncodableSequence.contents()', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('ASN1EncodableSequence.contents()');
		await allure.tags(...sharedTags);

		await allure.step('encodes 3 boolean elements', async (ctx) => {
			expect(
				new ASN1EncodableSequence([
					new ASN1Boolean(true),
					new ASN1Boolean(false),
					new ASN1Boolean(true),
				]).contents()
			).toStrictEqual(new Uint8Array([0x01, 0x01, 0xff, 0x01, 0x01, 0x00, 0x01, 0x01, 0xff]));
			await ctx.parameter('element count', String(3));
		});
	});

	test('ASN1Set.isSetOfSingleType()', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('ASN1Set.isSetOfSingleType()');
		await allure.tags(...sharedTags);

		await allure.step('returns true when all elements share the same type', async () => {
			expect(
				new ASN1Set([
					new ASN1Value(ASN1Class.Universal, ASN1Form.Primitive, 1, new Uint8Array([0x00])),
					new ASN1Value(ASN1Class.Universal, ASN1Form.Primitive, 1, new Uint8Array([0xff])),
				]).isSetOfSingleType(ASN1Class.Universal, ASN1Form.Primitive, 1)
			).toBe(true);
		});

		await allure.step('returns false when elements have differing tags', async () => {
			expect(
				new ASN1Set([
					new ASN1Value(ASN1Class.Universal, ASN1Form.Primitive, 1, new Uint8Array([0x00])),
					new ASN1Value(ASN1Class.Universal, ASN1Form.Primitive, 2, new Uint8Array([0x01])),
				]).isSetOfSingleType(ASN1Class.Universal, ASN1Form.Primitive, 1)
			).toBe(false);
		});
	});

	test('ASN1EncodableSet.contents()', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('ASN1EncodableSet.contents()');
		await allure.tags(...sharedTags);

		await allure.step('encodes 3 boolean elements', async (ctx) => {
			expect(
				new ASN1EncodableSet([
					new ASN1Boolean(true),
					new ASN1Boolean(false),
					new ASN1Boolean(true),
				]).contents()
			).toStrictEqual(new Uint8Array([0x01, 0x01, 0xff, 0x01, 0x01, 0x00, 0x01, 0x01, 0xff]));
			await ctx.parameter('element count', String(3));
		});
	});

	test('ASN1GeneralizedTime.contents()', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('ASN1GeneralizedTime.contents()');
		await allure.tags(...sharedTags);

		await allure.step('without milliseconds', async (ctx) => {
			expect(new ASN1GeneralizedTime(2000, 12, 31, 10, 40, 54, 0).contents()).toStrictEqual(
				new Uint8Array([
					0x32, 0x30, 0x30, 0x30, 0x31, 0x32, 0x33, 0x31, 0x31, 0x30, 0x34, 0x30, 0x35, 0x34, 0x5a,
				])
			);
			await ctx.parameter('datetime', '2000-12-31T10:40:54Z');
			await ctx.parameter('milliseconds', String(0));
		});

		await allure.step('with milliseconds', async (ctx) => {
			expect(new ASN1GeneralizedTime(2000, 12, 31, 10, 40, 54, 111).contents()).toStrictEqual(
				new Uint8Array([
					0x32, 0x30, 0x30, 0x30, 0x31, 0x32, 0x33, 0x31, 0x31, 0x30, 0x34, 0x30, 0x35, 0x34, 0x2e,
					0x31, 0x31, 0x31, 0x5a,
				])
			);
			await ctx.parameter('datetime', '2000-12-31T10:40:54.111Z');
			await ctx.parameter('milliseconds', String(111));
		});
	});

	test('ASN1GeneralizedTime.toDate()', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('ASN1GeneralizedTime.toDate()');
		await allure.tags(...sharedTags);

		await allure.step('ASN1GeneralizedTime.toDate()', async (ctx) => {
			expect(new ASN1GeneralizedTime(2000, 12, 31, 10, 40, 54, 111).toDate()).toStrictEqual(
				new Date('2000-12-31T10:40:54.111Z')
			);
			await ctx.parameter('expected', '2000-12-31T10:40:54.111Z');
		});
	});

	test('ASN1UTCTime.contents()', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('ASN1UTCTime.contents()');
		await allure.tags(...sharedTags);

		await allure.step('ASN1UTCTime.contents()', async (ctx) => {
			expect(new ASN1UTCTime(0, 12, 31, 10, 40, 54).contents()).toStrictEqual(
				new Uint8Array([0x30, 0x30, 0x31, 0x32, 0x33, 0x31, 0x31, 0x30, 0x34, 0x30, 0x35, 0x34, 0x5a])
			);
			await ctx.parameter('datetime', '00-12-31T10:40:54Z');
		});
	});

	test('ASN1UTCTime.toDate()', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('ASN1UTCTime.toDate()');
		await allure.tags(...sharedTags);

		await allure.step('ASN1UTCTime.toDate()', async (ctx) => {
			expect(new ASN1UTCTime(0, 12, 31, 10, 40, 54).toDate(20)).toStrictEqual(
				new Date('2000-12-31T10:40:54Z')
			);
			await ctx.parameter('century', String(20));
			await ctx.parameter('expected', '2000-12-31T10:40:54Z');
		});
	});
});
