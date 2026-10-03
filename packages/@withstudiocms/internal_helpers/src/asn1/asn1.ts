import { bigIntBytes, bigIntFromBytes, compareBytes, DynamicBuffer } from '../binary/index.js';
import {
	bigIntFromTwosComplementBytes,
	bigIntTwosComplementBytes,
	variableLengthQuantityBytes,
	variableLengthQuantityFromBytes,
} from './integer.js';
import { decodeASCII } from './string.js';

export function parseASN1NoLeftoverBytes(data: Uint8Array): ASN1Value {
	const [decoded, size] = parseASN1(data);
	if (data.byteLength !== size) {
		throw new ASN1LeftoverBytesError(data.byteLength - size);
	}
	return decoded;
}

export function parseASN1(data: Uint8Array): [result: ASN1Value, size: number] {
	if (data.byteLength < 2) {
		throw new ASN1ParseError();
	}

	let asn1Class: ASN1Class;
	if (data[0] >> 6 === 0b00) {
		asn1Class = ASN1Class.Universal;
	} else if (data[0] >> 6 === 0b01) {
		asn1Class = ASN1Class.Application;
	} else if (data[0] >> 6 === 0b10) {
		asn1Class = ASN1Class.ContextSpecific;
	} else if (data[0] >> 6 === 0b11) {
		asn1Class = ASN1Class.Private;
	} else {
		// unreachable
		throw new ASN1ParseError();
	}

	let encodingForm: ASN1Form;
	if (((data[0] >> 5) & 0x01) === 0) {
		encodingForm = ASN1Form.Primitive;
	} else if (((data[0] >> 5) & 0x01) === 1) {
		encodingForm = ASN1Form.Constructed;
	} else {
		// unreachable
		throw new ASN1ParseError();
	}

	let offset = 0;

	let tag: number;
	if ((data[0] & 0x1f) < 31) {
		tag = data[0] & 0x1f;
		offset++;
	} else {
		offset++;

		let decodedTag: bigint;
		let tagSize: number;
		try {
			[decodedTag, tagSize] = variableLengthQuantityFromBytes(data.slice(offset), 2);
		} catch {
			throw new ASN1ParseError();
		}
		if (decodedTag > 16384n) {
			throw new ASN1ParseError();
		}
		tag = Number(decodedTag);
		offset += tagSize;
	}
	if (data.byteLength < offset) {
		throw new ASN1ParseError();
	}

	if (data[offset] === 0x80) {
		// indefinite form
		throw new ASN1ParseError();
	}

	let contentLength = 0;
	if (data[offset] >> 7 === 0) {
		contentLength = data[offset] & 0x7f;
		offset++;
	} else {
		const contentLengthSize = data[offset] & 0x7f;
		offset++;
		if (contentLengthSize < 1 || data.byteLength < offset + contentLengthSize) {
			throw new ASN1ParseError();
		}
		const decodedContentLength = bigIntFromBytes(data.slice(offset, offset + contentLengthSize));
		offset += contentLengthSize;
		contentLength = Number(decodedContentLength);
	}
	if (data.length < offset + contentLength) {
		throw new ASN1ParseError();
	}

	const value = data.slice(offset, offset + contentLength);
	const result = new ASN1Value(asn1Class, encodingForm, tag, value);
	return [result, offset + contentLength];
}

export function encodeASN1(value: ASN1Encodable): Uint8Array {
	const encodedContents = value.contents();

	let firstByte = 0x00;
	if (value.class === ASN1Class.Universal) {
		firstByte |= 0x00;
	} else if (value.class === ASN1Class.Application) {
		firstByte |= 0x40;
	} else if (value.class === ASN1Class.ContextSpecific) {
		firstByte |= 0x80;
	} else if (value.class === ASN1Class.Private) {
		firstByte |= 0xc0;
	}

	if (value.form === ASN1Form.Primitive) {
		firstByte |= 0x00;
	} else if (value.form === ASN1Form.Constructed) {
		firstByte |= 0x20;
	}

	const buffer = new DynamicBuffer(1);

	if (value.tag < 0x1f) {
		firstByte |= value.tag;
		buffer.writeByte(firstByte);
	} else {
		firstByte |= 0x1f;
		buffer.writeByte(firstByte);
		const encodedTagNumber = variableLengthQuantityBytes(BigInt(value.tag));
		buffer.write(encodedTagNumber);
	}

	if (encodedContents.byteLength < 128) {
		buffer.writeByte(encodedContents.byteLength);
	} else {
		const encodedContentsLength = bigIntBytes(BigInt(encodedContents.byteLength));
		if (encodedContentsLength.byteLength > 126) {
			throw new ASN1EncodeError();
		}
		buffer.writeByte(encodedContentsLength.byteLength | 0x80);
		buffer.write(encodedContentsLength);
	}
	buffer.write(encodedContents);
	return buffer.bytes();
}

export interface ASN1Encodable {
	class: ASN1Class;
	form: ASN1Form;
	tag: number;

	contents(): Uint8Array;
}

export class ASN1Value implements ASN1Encodable {
	public class: ASN1Class;
	public form: ASN1Form;
	public tag: number;
	private _contents: Uint8Array;

	constructor(asn1Class: ASN1Class, form: ASN1Form, tag: number, value: Uint8Array) {
		this.class = asn1Class;
		this.form = form;
		this.tag = tag;
		this._contents = value;
	}

	public universalType(): ASN1UniversalType {
		if (this.class === ASN1Class.Universal && this.tag in ASN1_UNIVERSAL_TAG_MAP) {
			return ASN1_UNIVERSAL_TAG_MAP[this.tag];
		}
		throw new ASN1DecodeError();
	}

	public contents(): Uint8Array {
		return this._contents;
	}

	public boolean(): ASN1Boolean {
		if (this.universalType() !== ASN1UniversalType.Boolean) {
			throw new ASN1DecodeError();
		}
		if (this.form !== ASN1Form.Primitive) {
			throw new ASN1DecodeError();
		}
		if (this._contents.byteLength !== 1) {
			throw new ASN1DecodeError();
		}
		if (this._contents[0] === 0x00) {
			return new ASN1Boolean(false);
		}
		if (this._contents[0] === 0xff) {
			return new ASN1Boolean(true);
		}
		throw new ASN1DecodeError();
	}

	public integer(): ASN1Integer {
		if (this.universalType() !== ASN1UniversalType.Integer) {
			throw new ASN1DecodeError();
		}
		if (this.form !== ASN1Form.Primitive) {
			throw new ASN1DecodeError();
		}
		if (this._contents.byteLength < 1) {
			throw new ASN1DecodeError();
		}
		return new ASN1Integer(bigIntFromTwosComplementBytes(this._contents));
	}

	public bitString(): ASN1BitString {
		if (this.universalType() !== ASN1UniversalType.BitString) {
			throw new ASN1DecodeError();
		}
		if (this.form !== ASN1Form.Primitive) {
			throw new ASN1DecodeError();
		}
		if (this._contents.byteLength < 1) {
			throw new ASN1DecodeError();
		}
		const unusedBits = this._contents[0];
		if (unusedBits > 7) {
			throw new ASN1DecodeError();
		}
		const value = this._contents.slice(1);
		if (unusedBits > 0 && value.byteLength === 0) {
			throw new ASN1DecodeError();
		}
		return new ASN1BitString(value, value.byteLength * 8 - unusedBits);
	}

	public octetString(): ASN1OctetString {
		if (this.universalType() !== ASN1UniversalType.OctetString) {
			throw new ASN1DecodeError();
		}
		if (this.form !== ASN1Form.Primitive) {
			throw new ASN1DecodeError();
		}
		return new ASN1OctetString(this._contents);
	}

	public null(): ASN1Null {
		if (this.universalType() !== ASN1UniversalType.Null) {
			throw new ASN1DecodeError();
		}
		if (this.form !== ASN1Form.Primitive) {
			throw new ASN1DecodeError();
		}
		if (this._contents.byteLength > 0) {
			throw new ASN1DecodeError();
		}
		return new ASN1Null();
	}

	public objectIdentifier(): ASN1ObjectIdentifier {
		if (this.universalType() !== ASN1UniversalType.ObjectIdentifier) {
			throw new ASN1DecodeError();
		}
		if (this.form !== ASN1Form.Primitive) {
			throw new ASN1DecodeError();
		}
		if (this._contents.byteLength < 1) {
			throw new ASN1DecodeError();
		}
		return new ASN1ObjectIdentifier(this._contents);
	}

	public real(): ASN1Real {
		if (this.universalType() !== ASN1UniversalType.Real) {
			throw new ASN1DecodeError();
		}
		if (this.form !== ASN1Form.Primitive) {
			throw new ASN1DecodeError();
		}
		if (this._contents.length === 0) {
			return new ASN1RealZero();
		}
		if (this._contents[0] >> 7 === 1) {
			// Binary
			let base: RealBinaryEncodingBase;
			if (((this._contents[0] >> 4) & 0x03) === 0x00) {
				base = RealBinaryEncodingBase.Base2;
			} else if (((this._contents[0] >> 4) & 0x03) === 0x01) {
				base = RealBinaryEncodingBase.Base8;
			} else if (((this._contents[0] >> 4) & 0x03) === 0x02) {
				base = RealBinaryEncodingBase.Base16;
			} else {
				throw new ASN1DecodeError();
			}
			const scalingFactor = (this._contents[0] >> 2) & 0x03;
			let exponent: bigint;
			let encodedExponentSize: number;
			if ((this._contents[0] & 0x03) === 0x00) {
				if (this._contents.byteLength < 2) {
					throw new ASN1DecodeError();
				}
				exponent = bigIntFromTwosComplementBytes(this._contents.slice(1, 2));
				encodedExponentSize = 1;
			} else if ((this._contents[0] & 0x03) === 0x01) {
				if (this._contents.byteLength < 3) {
					throw new ASN1DecodeError();
				}
				exponent = bigIntFromTwosComplementBytes(this._contents.slice(1, 3));
				encodedExponentSize = 2;
			} else if ((this._contents[0] & 0x03) === 0x02) {
				if (this._contents.byteLength < 4) {
					throw new ASN1DecodeError();
				}
				exponent = bigIntFromTwosComplementBytes(this._contents.slice(1, 4));
				encodedExponentSize = 3;
			} else if ((this._contents[0] & 0x03) === 0x03) {
				if (this._contents.byteLength < 2) {
					throw new ASN1DecodeError();
				}
				const exponentSize = this._contents[1];
				// in DER, it should really be at least 4
				if (exponentSize < 1) {
					throw new ASN1DecodeError();
				}
				if (this._contents.byteLength < 2 + exponentSize) {
					throw new ASN1DecodeError();
				}
				exponent = bigIntFromTwosComplementBytes(this._contents.slice(2, 2 + exponentSize));
				encodedExponentSize = 1 + exponentSize;
			} else {
				// unreachable
				throw new ASN1DecodeError();
			}
			if (this._contents.byteLength === 1 + encodedExponentSize) {
				throw new ASN1DecodeError();
			}
			const N = bigIntFromBytes(this._contents.slice(1 + encodedExponentSize));
			let mantissa = N * BigInt(2 ** scalingFactor);
			if (((this._contents[0] >> 6) & 0x01) === 0x01) {
				mantissa = mantissa * -1n;
			}
			return new ASN1RealBinaryEncoding(mantissa, base, exponent);
		}
		if (this._contents[0] === 0x01) {
			return new ASN1RealDecimalEncoding(
				RealDecimalEncodingFormat.ISO6093NR1,
				this._contents.slice(1)
			);
		}
		if (this._contents[0] === 0x02) {
			return new ASN1RealDecimalEncoding(
				RealDecimalEncodingFormat.ISO6093NR2,
				this._contents.slice(1)
			);
		}
		if (this._contents[0] === 0x03) {
			return new ASN1RealDecimalEncoding(
				RealDecimalEncodingFormat.ISO6093NR3,
				this._contents.slice(1)
			);
		}
		if (this._contents[0] === 0x40) {
			return new ASN1SpecialReal(SpecialReal.PlusInfinity);
		}
		if (this._contents[0] === 0x41) {
			return new ASN1SpecialReal(SpecialReal.MinusInfinity);
		}
		// unreachable
		throw new ASN1DecodeError();
	}

	public enumerated(): ASN1Enumerated {
		if (this.universalType() !== ASN1UniversalType.Enumerated) {
			throw new ASN1DecodeError();
		}
		if (this.form !== ASN1Form.Primitive) {
			throw new ASN1DecodeError();
		}
		if (this._contents.byteLength < 1) {
			throw new ASN1DecodeError();
		}
		return new ASN1Enumerated(bigIntFromTwosComplementBytes(this._contents));
	}

	public utf8String(): ASN1UTF8String {
		if (this.universalType() !== ASN1UniversalType.UTF8String) {
			throw new ASN1DecodeError();
		}
		if (this.form !== ASN1Form.Primitive) {
			throw new ASN1DecodeError();
		}
		return new ASN1UTF8String(this._contents);
	}

	public sequence(): ASN1Sequence {
		if (this.universalType() !== ASN1UniversalType.Sequence) {
			throw new ASN1DecodeError();
		}
		if (this.form !== ASN1Form.Constructed) {
			throw new ASN1DecodeError();
		}
		const elements: ASN1Value[] = [];
		let readBytes = 0;
		while (readBytes !== this._contents.byteLength) {
			const [parsedElement, parsedElementSize] = parseASN1(this._contents.slice(readBytes));
			elements.push(parsedElement);
			readBytes += parsedElementSize;
		}
		return new ASN1Sequence(elements);
	}

	public set(): ASN1Set {
		if (this.universalType() !== ASN1UniversalType.Set) {
			throw new ASN1DecodeError();
		}
		if (this.form !== ASN1Form.Constructed) {
			throw new ASN1DecodeError();
		}
		const elements: ASN1Value[] = [];
		let readBytes = 0;
		while (readBytes !== this._contents.byteLength) {
			const [parsedElement, parsedElementSize] = parseASN1(this._contents.slice(readBytes));
			elements.push(parsedElement);
			readBytes += parsedElementSize;
		}
		return new ASN1Set(elements);
	}

	public numericString(): ASN1NumericString {
		if (this.universalType() !== ASN1UniversalType.NumericString) {
			throw new ASN1DecodeError();
		}
		if (this.form !== ASN1Form.Primitive) {
			throw new ASN1DecodeError();
		}
		return new ASN1NumericString(this._contents);
	}

	public printableString(): ASN1PrintableString {
		if (this.universalType() !== ASN1UniversalType.PrintableString) {
			throw new ASN1DecodeError();
		}
		if (this.form !== ASN1Form.Primitive) {
			throw new ASN1DecodeError();
		}
		return new ASN1PrintableString(this._contents);
	}

	public ia5String(): ASN1IA5String {
		if (this.universalType() !== ASN1UniversalType.IA5String) {
			throw new ASN1DecodeError();
		}
		if (this.form !== ASN1Form.Primitive) {
			throw new ASN1DecodeError();
		}
		return new ASN1IA5String(this._contents);
	}

	public utcTime(): ASN1UTCTime {
		if (this.universalType() !== ASN1UniversalType.UTCTime) {
			throw new ASN1DecodeError();
		}
		if (this.form !== ASN1Form.Primitive) {
			throw new ASN1DecodeError();
		}
		let decodedString = decodeASCII(this._contents);
		if (decodedString.length !== 13 || !decodedString.endsWith('Z')) {
			throw new ASN1DecodeError();
		}
		decodedString = decodedString.replace('Z', '');
		return new ASN1UTCTime(
			Number(decodedString.slice(0, 2)),
			Number(decodedString.slice(2, 4)),
			Number(decodedString.slice(4, 6)),
			Number(decodedString.slice(6, 8)),
			Number(decodedString.slice(8, 10)),
			Number(decodedString.slice(10, 12))
		);
	}

	public generalizedTime(): ASN1GeneralizedTime {
		if (this.universalType() !== ASN1UniversalType.GeneralizedTime) {
			throw new ASN1DecodeError();
		}
		if (this.form !== ASN1Form.Primitive) {
			throw new ASN1DecodeError();
		}
		let decodedString = decodeASCII(this._contents);
		if (!decodedString.endsWith('Z')) {
			throw new ASN1DecodeError();
		}
		decodedString = decodedString.replace('Z', '');
		let wholePart: string;
		let decimalPart: string | null = null;
		if (decodedString.includes('.')) {
			[wholePart, decimalPart] = decodedString.split('.');
		} else {
			wholePart = decodedString;
		}
		if (wholePart.length !== 14) {
			throw new ASN1DecodeError();
		}
		let milliseconds = 0;
		if (decimalPart !== null) {
			if (decimalPart.length > 3) {
				throw new ASN1DecodeError();
			}
			milliseconds = Number(decimalPart.padEnd(3, '0'));
		}
		return new ASN1GeneralizedTime(
			Number(wholePart.slice(0, 4)),
			Number(wholePart.slice(4, 6)),
			Number(wholePart.slice(6, 8)),
			Number(wholePart.slice(8, 10)),
			Number(wholePart.slice(10, 12)),
			Number(wholePart.slice(12, 14)),
			milliseconds
		);
	}
}

export class ASN1Boolean implements ASN1Encodable {
	public class = ASN1Class.Universal;
	public form = ASN1Form.Primitive;
	public tag = ASN1_UNIVERSAL_TAG.BOOLEAN;
	public value: boolean;

	constructor(value: boolean) {
		this.value = value;
	}

	public contents(): Uint8Array {
		if (this.value) {
			return new Uint8Array([0xff]);
		}
		return new Uint8Array([0x00]);
	}
}

export class ASN1Integer implements ASN1Encodable {
	public class = ASN1Class.Universal;
	public form = ASN1Form.Primitive;
	public tag = ASN1_UNIVERSAL_TAG.INTEGER;
	public value: bigint;

	constructor(value: bigint) {
		this.value = value;
	}

	public contents(): Uint8Array {
		return bigIntTwosComplementBytes(this.value);
	}
}

export class ASN1BitString implements ASN1Encodable {
	public class = ASN1Class.Universal;
	public form = ASN1Form.Primitive;
	public tag = ASN1_UNIVERSAL_TAG.BIT_STRING;
	public bytes: Uint8Array;
	public length: number;

	constructor(bytes: Uint8Array, length: number) {
		if (length > bytes.byteLength * 8) {
			throw new TypeError('Data too small');
		}
		if (length <= (bytes.byteLength - 1) * 8) {
			throw new TypeError('Data too large');
		}
		this.bytes = bytes;
		this.length = length;
	}

	public contents(): Uint8Array {
		let remainingBitsInLastByte = 8 - (this.length % 8);
		if (remainingBitsInLastByte === 8) {
			remainingBitsInLastByte = 0;
		}
		const encoded = new Uint8Array(this.bytes.byteLength + 1);
		encoded[0] = remainingBitsInLastByte;
		encoded.set(this.bytes, 1);
		return encoded;
	}
}

export class ASN1Enumerated implements ASN1Encodable {
	public class = ASN1Class.Universal;
	public form = ASN1Form.Primitive;
	public tag = ASN1_UNIVERSAL_TAG.ENUMERATED;
	public value: bigint;

	constructor(value: bigint) {
		this.value = value;
	}

	public contents(): Uint8Array {
		return bigIntTwosComplementBytes(this.value);
	}
}

export class ASN1RealBinaryEncoding implements ASN1Encodable {
	public class = ASN1Class.Universal;
	public form = ASN1Form.Primitive;
	public tag = ASN1_UNIVERSAL_TAG.REAL;
	public mantissa: bigint;
	public base: RealBinaryEncodingBase;
	public exponent: bigint;

	constructor(mantissa: bigint, base: RealBinaryEncodingBase, exponent: bigint) {
		if (mantissa === 0n) {
			throw new TypeError('The mantissa cannot be zero');
		}
		this.mantissa = mantissa;
		this.base = base;
		this.exponent = exponent;
	}

	public contents(): Uint8Array {
		let N: bigint;
		let scalingFactor: number;
		if (this.mantissa % 8n === 0n) {
			N = absBigInt(this.mantissa) / 8n;
			scalingFactor = 3;
		} else if (this.mantissa % 4n === 0n) {
			N = absBigInt(this.mantissa) / 4n;
			scalingFactor = 2;
		} else if (this.mantissa % 2n === 0n) {
			N = absBigInt(this.mantissa) / 2n;
			scalingFactor = 1;
		} else {
			N = absBigInt(this.mantissa);
			scalingFactor = 0;
		}

		let firstByte = 0x80;
		if (this.mantissa < 0) {
			firstByte |= 0x40;
		}
		if (this.base === RealBinaryEncodingBase.Base8) {
			firstByte |= 0x10;
		} else if (this.base === RealBinaryEncodingBase.Base16) {
			firstByte |= 0x20;
		}
		firstByte |= scalingFactor << 2;

		let encodedExponent: Uint8Array;
		const exponentBytes = bigIntTwosComplementBytes(this.exponent);
		if (exponentBytes.byteLength === 1) {
			encodedExponent = new Uint8Array(1);
			encodedExponent.set(exponentBytes);
		} else if (exponentBytes.byteLength === 2) {
			firstByte |= 0x01;
			encodedExponent = new Uint8Array(2);
			encodedExponent.set(exponentBytes);
		} else if (exponentBytes.byteLength === 3) {
			firstByte |= 0x02;
			encodedExponent = new Uint8Array(3);
			encodedExponent.set(exponentBytes);
		} else {
			if (exponentBytes.byteLength > 255) {
				throw new ASN1DecodeError();
			}
			firstByte |= 0x03;
			encodedExponent = new Uint8Array(exponentBytes.byteLength + 1);
			encodedExponent[0] = exponentBytes.byteLength;
			encodedExponent.set(exponentBytes, 1);
		}

		const nBytes = bigIntBytes(N);
		const encoded = new Uint8Array(1 + encodedExponent.byteLength + nBytes.byteLength);
		encoded[0] = firstByte;
		encoded.set(encodedExponent, 1);
		encoded.set(nBytes, 1 + encodedExponent.byteLength);
		return encoded;
	}
}

function absBigInt(value: bigint): bigint {
	if (value < 0) {
		return value * -1n;
	}
	return value;
}

export enum RealBinaryEncodingBase {
	Base2 = 0,
	Base8 = 1,
	Base16 = 2,
}

export type ASN1Real =
	| ASN1RealZero
	| ASN1SpecialReal
	| ASN1RealDecimalEncoding
	| ASN1RealBinaryEncoding;

export class ASN1RealDecimalEncoding implements ASN1Encodable {
	public class = ASN1Class.Universal;
	public form = ASN1Form.Primitive;
	public tag = ASN1_UNIVERSAL_TAG.REAL;

	public encodingFormat: RealDecimalEncodingFormat;
	public value: Uint8Array;

	constructor(encodingFormat: RealDecimalEncodingFormat, value: Uint8Array) {
		this.encodingFormat = encodingFormat;
		this.value = value;
	}

	public contents(): Uint8Array {
		const encoded = new Uint8Array(1 + this.value.byteLength);
		if (this.encodingFormat === RealDecimalEncodingFormat.ISO6093NR1) {
			encoded[0] = 0x01;
		} else if (this.encodingFormat === RealDecimalEncodingFormat.ISO6093NR2) {
			encoded[0] = 0x02;
		} else if (this.encodingFormat === RealDecimalEncodingFormat.ISO6093NR3) {
			encoded[0] = 0x03;
		}
		encoded.set(this.value, 1);
		return encoded;
	}

	public decodeText(): string {
		return new TextDecoder().decode(this.value);
	}

	public decodeNumber(): number {
		return Number(this.decodeText());
	}
}

export enum RealDecimalEncodingFormat {
	ISO6093NR1 = 0,
	ISO6093NR2 = 1,
	ISO6093NR3 = 2,
}

export class ASN1SpecialReal implements ASN1Encodable {
	public class = ASN1Class.Universal;
	public form = ASN1Form.Primitive;
	public tag = ASN1_UNIVERSAL_TAG.REAL;
	public value: SpecialReal;

	constructor(value: SpecialReal) {
		this.value = value;
	}

	public contents(): Uint8Array {
		switch (this.value) {
			case SpecialReal.PlusInfinity:
				return new Uint8Array([0x40]);
			case SpecialReal.MinusInfinity:
				return new Uint8Array([0x41]);
		}
	}
}

export enum SpecialReal {
	PlusInfinity = 0,
	MinusInfinity = 1,
}

export class ASN1RealZero implements ASN1Encodable {
	public class = ASN1Class.Universal;
	public form = ASN1Form.Primitive;
	public tag = ASN1_UNIVERSAL_TAG.REAL;
	public value = 0;

	public contents(): Uint8Array {
		return new Uint8Array(0);
	}
}

export class ASN1OctetString implements ASN1Encodable {
	public class = ASN1Class.Universal;
	public form = ASN1Form.Primitive;
	public tag = ASN1_UNIVERSAL_TAG.OCTET_STRING;
	public value: Uint8Array;

	constructor(value: Uint8Array) {
		this.value = value;
	}

	public contents(): Uint8Array {
		return this.value;
	}
}

export class ASN1Null implements ASN1Encodable {
	public class = ASN1Class.Universal;
	public form = ASN1Form.Primitive;
	public tag = ASN1_UNIVERSAL_TAG.NULL;

	public contents(): Uint8Array {
		return new Uint8Array(0);
	}
}

export class ASN1Sequence implements ASN1Encodable {
	public class = ASN1Class.Universal;
	public form = ASN1Form.Constructed;
	public tag = ASN1_UNIVERSAL_TAG.SEQUENCE;
	public elements: ASN1Value[];

	constructor(elements: ASN1Value[]) {
		this.elements = elements;
	}

	public contents(): Uint8Array {
		const buffer = new DynamicBuffer(0);
		for (const element of this.elements) {
			buffer.write(encodeASN1(element));
		}
		return buffer.bytes();
	}

	public isSequenceOfSingleType(asn1Class: ASN1Class, form: ASN1Form, tag: number): boolean {
		for (const element of this.elements) {
			if (element.class !== asn1Class || element.form !== form || element.tag !== tag) {
				return false;
			}
		}
		return true;
	}

	public at(index: number): ASN1Value {
		if (index < this.elements.length) {
			return this.elements[index];
		}
		throw new Error('Invalid index');
	}
}

export class ASN1EncodableSequence implements ASN1Encodable {
	public class = ASN1Class.Universal;
	public form = ASN1Form.Constructed;
	public tag = ASN1_UNIVERSAL_TAG.SEQUENCE;
	public elements: ASN1Encodable[];

	constructor(elements: ASN1Encodable[]) {
		this.elements = elements;
	}

	public contents(): Uint8Array {
		const buffer = new DynamicBuffer(0);
		for (const element of this.elements) {
			buffer.write(encodeASN1(element));
		}
		return buffer.bytes();
	}
}

export class ASN1Set implements ASN1Encodable {
	public class = ASN1Class.Universal;
	public form = ASN1Form.Constructed;
	public tag = ASN1_UNIVERSAL_TAG.SET;
	public elements: ASN1Value[];

	constructor(elements: ASN1Value[]) {
		this.elements = elements;
	}

	public contents(): Uint8Array {
		const buffer = new DynamicBuffer(0);
		for (const element of this.elements) {
			buffer.write(encodeASN1(element));
		}
		return buffer.bytes();
	}

	public isSetOfSingleType(asn1Class: ASN1Class, form: ASN1Form, tag: number): boolean {
		for (const element of this.elements) {
			if (element.class !== asn1Class || element.form !== form || element.tag !== tag) {
				return false;
			}
		}
		return true;
	}

	public at(index: number): ASN1Value {
		if (index < this.elements.length) {
			return this.elements[index];
		}
		throw new Error('Invalid index');
	}
}

export class ASN1EncodableSet implements ASN1Encodable {
	public class = ASN1Class.Universal;
	public form = ASN1Form.Constructed;
	public tag = ASN1_UNIVERSAL_TAG.SET;
	public elements: ASN1Encodable[];

	constructor(elements: ASN1Encodable[]) {
		this.elements = elements;
	}

	public contents(): Uint8Array {
		const buffer = new DynamicBuffer(0);
		for (const element of this.elements) {
			buffer.write(encodeASN1(element));
		}
		return buffer.bytes();
	}
}

export class ASN1ObjectIdentifier implements ASN1Encodable {
	public class = ASN1Class.Universal;
	public form = ASN1Form.Primitive;
	public tag = ASN1_UNIVERSAL_TAG.OBJECT_IDENTIFIER;
	public encoded: Uint8Array;

	constructor(encoded: Uint8Array) {
		this.encoded = encoded;
	}

	public contents(): Uint8Array {
		return this.encoded;
	}

	public is(objectIdentifier: string): boolean {
		return compareBytes(encodeObjectIdentifier(objectIdentifier), this.encoded);
	}
}

// TODO?: relative object identifier

export class ASN1NumericString implements ASN1Encodable {
	public class = ASN1Class.Universal;
	public form = ASN1Form.Primitive;
	public tag = ASN1_UNIVERSAL_TAG.NUMERIC_STRING;
	public value: Uint8Array;

	constructor(value: Uint8Array) {
		this.value = value;
	}

	public contents(): Uint8Array {
		return this.value;
	}

	public decodeText(): string {
		for (let i = 0; i < this.value.byteLength; i++) {
			if (this.value[i] === 0x20) {
				continue;
			}
			if (this.value[i] >= 0x30 && this.value[i] <= 0x39) {
				continue;
			}
			throw new TypeError('Invalid numeric string');
		}
		return new TextDecoder().decode(this.value);
	}
}

export class ASN1PrintableString implements ASN1Encodable {
	public class = ASN1Class.Universal;
	public form = ASN1Form.Primitive;
	public tag = ASN1_UNIVERSAL_TAG.PRINTABLE_STRING;
	public value: Uint8Array;

	constructor(value: Uint8Array) {
		this.value = value;
	}

	public contents(): Uint8Array {
		return this.value;
	}

	public decodeText(): string {
		for (let i = 0; i < this.value.byteLength; i++) {
			if (this.value[i] === 0x20) {
				continue;
			}
			if (this.value[i] >= 0x27 && this.value[i] >= 0x29) {
				continue;
			}
			if (this.value[i] >= 0x2b && this.value[i] >= 0x2f) {
				continue;
			}
			if (this.value[i] >= 0x30 && this.value[i] <= 0x39) {
				continue;
			}
			if (this.value[i] === 0x3d) {
				continue;
			}
			if (this.value[i] === 0x3f) {
				continue;
			}
			if (this.value[i] >= 0x41 && this.value[i] <= 0x5a) {
				continue;
			}
			if (this.value[i] >= 0x61 && this.value[i] <= 0x7a) {
				continue;
			}
			throw new TypeError('Invalid printable string');
		}
		return new TextDecoder().decode(this.value);
	}
}

export class ASN1UTF8String implements ASN1Encodable {
	public class = ASN1Class.Universal;
	public form = ASN1Form.Primitive;
	public tag = ASN1_UNIVERSAL_TAG.UTF8_STRING;
	public value: Uint8Array;

	constructor(value: Uint8Array) {
		this.value = value;
	}

	public contents(): Uint8Array {
		return this.value;
	}

	public decodeText(): string {
		return new TextDecoder().decode(this.value);
	}
}

export class ASN1IA5String implements ASN1Encodable {
	public class = ASN1Class.Universal;
	public form = ASN1Form.Primitive;
	public tag = ASN1_UNIVERSAL_TAG.IA5_STRING;
	public value: Uint8Array;

	constructor(value: Uint8Array) {
		this.value = value;
	}

	public contents(): Uint8Array {
		return this.value;
	}

	public decodeText(): string {
		return decodeASCII(this.value);
	}
}

export class ASN1GeneralizedTime implements ASN1Encodable {
	public class = ASN1Class.Universal;
	public form = ASN1Form.Primitive;
	public tag = ASN1_UNIVERSAL_TAG.GENERALIZED_TIME;

	public year: number;
	public month: number;
	public date: number;
	public hours: number;
	public minutes: number;
	public seconds: number;
	public milliseconds: number;

	constructor(
		year: number,
		month: number,
		date: number,
		hours: number,
		minutes: number,
		seconds: number,
		milliseconds: number
	) {
		if (!Number.isInteger(year) || year < 0 || year > 9999) {
			throw new TypeError('Invalid year');
		}
		if (!Number.isInteger(month) || month < 1 || month > 12) {
			throw new TypeError('Invalid month');
		}
		if (!Number.isInteger(date) || date < 1 || date > 99) {
			throw new TypeError('Invalid date');
		}
		if (!Number.isInteger(hours) || hours < 0 || hours > 23) {
			throw new TypeError('Invalid hours');
		}
		if (!Number.isInteger(minutes) || minutes < 0 || minutes > 59) {
			throw new TypeError('Invalid minutes');
		}
		if (!Number.isInteger(seconds) || seconds < 0 || seconds > 59) {
			throw new TypeError('Invalid seconds');
		}
		if (!Number.isInteger(milliseconds) || milliseconds < 0 || milliseconds > 999) {
			throw new TypeError('Invalid milliseconds');
		}
		this.year = year;
		this.month = month;
		this.date = date;
		this.hours = hours;
		this.minutes = minutes;
		this.seconds = seconds;
		this.milliseconds = milliseconds;
	}

	public contents(): Uint8Array {
		let text = this.year.toString().padStart(4, '0');
		text += this.month.toString().padStart(2, '0');
		text += this.date.toString().padStart(2, '0');
		text += this.hours.toString().padStart(2, '0');
		text += this.minutes.toString().padStart(2, '0');
		text += this.seconds.toString().padStart(2, '0');
		if (this.milliseconds > 0) {
			text += (this.milliseconds / 1000).toString().replace('0', '');
		}
		text += 'Z';
		return new TextEncoder().encode(text);
	}

	public toDate(): Date {
		const date = new Date();
		date.setUTCFullYear(this.year);
		date.setUTCMonth(this.month - 1);
		date.setUTCDate(this.date);
		date.setUTCHours(this.hours);
		date.setUTCMinutes(this.minutes);
		date.setUTCSeconds(this.seconds);
		date.setUTCMilliseconds(this.milliseconds);
		return date;
	}
}

export class ASN1UTCTime implements ASN1Encodable {
	public class = ASN1Class.Universal;
	public form = ASN1Form.Primitive;
	public tag = ASN1_UNIVERSAL_TAG.UTC_TIME;

	public year: number;
	public month: number;
	public date: number;
	public hours: number;
	public minutes: number;
	public seconds: number;

	constructor(
		year: number,
		month: number,
		date: number,
		hours: number,
		minutes: number,
		seconds: number
	) {
		if (!Number.isInteger(year) || year < 0 || year > 99) {
			throw new TypeError('Invalid year');
		}
		if (!Number.isInteger(month) || month < 1 || month > 12) {
			throw new TypeError('Invalid month');
		}
		if (!Number.isInteger(date) || date < 1 || date > 99) {
			throw new TypeError('Invalid date');
		}
		if (!Number.isInteger(hours) || hours < 0 || hours > 23) {
			throw new TypeError('Invalid hours');
		}
		if (!Number.isInteger(minutes) || minutes < 0 || minutes > 59) {
			throw new TypeError('Invalid minutes');
		}
		if (!Number.isInteger(seconds) || seconds < 0 || seconds > 59) {
			throw new TypeError('Invalid seconds');
		}
		this.year = year;
		this.month = month;
		this.date = date;
		this.hours = hours;
		this.minutes = minutes;
		this.seconds = seconds;
	}

	public contents(): Uint8Array {
		let text = this.year.toString().padStart(2, '0');
		text += this.month.toString().padStart(2, '0');
		text += this.date.toString().padStart(2, '0');
		text += this.hours.toString().padStart(2, '0');
		text += this.minutes.toString().padStart(2, '0');
		text += this.seconds.toString().padStart(2, '0');
		text += 'Z';
		return new TextEncoder().encode(text);
	}

	public toDate(century: number): Date {
		if (century < 0 || century > 99) {
			throw new TypeError('Invalid century');
		}
		const date = new Date();
		date.setUTCFullYear(century * 100 + this.year);
		date.setUTCMonth(this.month - 1);
		date.setUTCDate(this.date);
		date.setUTCHours(this.hours);
		date.setUTCMinutes(this.minutes);
		date.setUTCSeconds(this.seconds);
		date.setUTCMilliseconds(0);
		return date;
	}
}

export function encodeObjectIdentifier(oid: string): Uint8Array {
	const parts = oid.split('.');
	const components: number[] = [];
	for (let i = 0; i < parts.length; i++) {
		const parsed = Number(parts[i]);
		if (!Number.isInteger(parsed) || parsed < 0) {
			throw new TypeError('Invalid object identifier');
		}
		components[i] = parsed;
	}
	if (components.length < 2) {
		throw new TypeError('Invalid object identifier');
	}
	const firstSubidentifier = components[0] * 40 + components[1];
	const buffer = new DynamicBuffer(0);
	buffer.write(variableLengthQuantityBytes(BigInt(firstSubidentifier)));
	for (let i = 2; i < components.length; i++) {
		buffer.write(variableLengthQuantityBytes(BigInt(components[i])));
	}
	return buffer.bytes();
}

export enum ASN1UniversalType {
	Boolean = 0,
	Integer = 1,
	BitString = 2,
	OctetString = 3,
	Null = 4,
	ObjectIdentifier = 5,
	ObjectDescriptor = 6,
	External = 7,
	Real = 8,
	Enumerated = 9,
	EmbeddedPDV = 10,
	UTF8String = 11,
	RelativeObjectIdentifier = 12,
	Time = 13,
	Sequence = 14,
	Set = 15,
	NumericString = 16,
	PrintableString = 17,
	TeletexString = 18,
	VideotextString = 19,
	IA5String = 20,
	UTCTime = 21,
	GeneralizedTime = 22,
	GraphicString = 23,
	VisibleString = 24,
	GeneralString = 25,
	UniversalString = 26,
	CharacterString = 27,
	BMPString = 28,
}

export enum ASN1Class {
	Universal = 0,
	Application = 1,
	ContextSpecific = 2,
	Private = 3,
}

export enum ASN1Form {
	Primitive = 0,
	Constructed = 1,
}

export const ASN1_UNIVERSAL_TAG = {
	BOOLEAN: 1,
	INTEGER: 2,
	BIT_STRING: 3,
	OCTET_STRING: 4,
	NULL: 5,
	OBJECT_IDENTIFIER: 6,
	OBJECT_DESCRIPTOR: 7,
	EXTERNAL: 8,
	REAL: 9,
	ENUMERATED: 10,
	EMBEDDED_PDV: 11,
	UTF8_STRING: 12,
	RELATIVE_OBJECT_IDENTIFIER: 13,
	TIME: 14,
	SEQUENCE: 16,
	SET: 17,
	NUMERIC_STRING: 18,
	PRINTABLE_STRING: 19,
	TELETEX_STRING: 20,
	VIDEOTEX_STRING: 21,
	IA5_STRING: 22,
	UTC_TIME: 23,
	GENERALIZED_TIME: 24,
	GRAPHIC_STRING: 25,
	VISIBLE_STRING: 26,
	GENERAL_STRING: 27,
	UNIVERSAL_STRING: 28,
	CHARACTER_STRING: 29,
	BMP_STRING: 30,
} as const;

const ASN1_UNIVERSAL_TAG_MAP: Record<number, ASN1UniversalType> = {
	1: ASN1UniversalType.Boolean,
	2: ASN1UniversalType.Integer,
	3: ASN1UniversalType.BitString,
	4: ASN1UniversalType.OctetString,
	5: ASN1UniversalType.Null,
	6: ASN1UniversalType.ObjectIdentifier,
	7: ASN1UniversalType.ObjectDescriptor,
	8: ASN1UniversalType.External,
	9: ASN1UniversalType.Real,
	10: ASN1UniversalType.Enumerated,
	11: ASN1UniversalType.EmbeddedPDV,
	12: ASN1UniversalType.UTF8String,
	13: ASN1UniversalType.RelativeObjectIdentifier,
	14: ASN1UniversalType.Time,
	16: ASN1UniversalType.Sequence,
	17: ASN1UniversalType.Set,
	18: ASN1UniversalType.NumericString,
	19: ASN1UniversalType.PrintableString,
	20: ASN1UniversalType.TeletexString,
	21: ASN1UniversalType.VideotextString,
	22: ASN1UniversalType.IA5String,
	23: ASN1UniversalType.UTCTime,
	24: ASN1UniversalType.GeneralizedTime,
	25: ASN1UniversalType.GraphicString,
	26: ASN1UniversalType.VisibleString,
	27: ASN1UniversalType.GeneralString,
	28: ASN1UniversalType.UniversalString,
	29: ASN1UniversalType.CharacterString,
	30: ASN1UniversalType.BMPString,
};

export class ASN1ParseError extends Error {
	constructor() {
		super('Failed to parse ASN.1');
	}
}

export class ASN1DecodeError extends Error {
	constructor() {
		super('Failed to decode ASN.1');
	}
}

export class ASN1EncodeError extends Error {
	constructor() {
		super('Failed to encode ASN.1');
	}
}

export class ASN1LeftoverBytesError extends Error {
	constructor(count: number) {
		super(`ASN.1 leftover bytes: ${count}`);
	}
}
