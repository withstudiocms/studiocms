import {
	ASN1BitString,
	ASN1EncodableSequence,
	ASN1Integer,
	ASN1ObjectIdentifier,
	encodeASN1,
	encodeObjectIdentifier,
	parseASN1NoLeftoverBytes,
} from '../../asn1/index.js';
import { bigIntBytes, bigIntFromBytes } from '../../binary/index.js';
import type { ECDSANamedCurve } from './curve.js';
import { ECDSAPoint } from './curve.js';
import { euclideanMod, inverseMod, tonelliShanks } from './math.js';

export function verifyECDSASignature(
	publicKey: ECDSAPublicKey,
	hash: Uint8Array,
	signature: ECDSASignature
): boolean {
	const q = new ECDSAPoint(publicKey.x, publicKey.y);
	if (!publicKey.curve.isOnCurve(q)) {
		return false;
	}
	if (publicKey.curve.multiply(publicKey.curve.n, q) !== null) {
		return false;
	}
	const e = hash.slice(0, publicKey.curve.size);
	const u1 = euclideanMod(
		bigIntFromBytes(e) * inverseMod(signature.s, publicKey.curve.n),
		publicKey.curve.n
	);
	const u1G = publicKey.curve.multiply(u1, publicKey.curve.g);
	if (u1G === null) {
		return false;
	}
	const u2 = euclideanMod(
		signature.r * inverseMod(signature.s, publicKey.curve.n),
		publicKey.curve.n
	);
	const u2Q = publicKey.curve.multiply(u2, q);
	if (u2Q === null) {
		return false;
	}
	const coord1 = publicKey.curve.add(u1G, u2Q);
	if (coord1 === null) {
		return false;
	}
	return euclideanMod(signature.r, publicKey.curve.n) === coord1.x;
}

export class ECDSAPublicKey {
	public curve: ECDSANamedCurve;
	public x: bigint;
	public y: bigint;

	constructor(curve: ECDSANamedCurve, x: bigint, y: bigint) {
		this.curve = curve;
		this.x = x;
		this.y = y;
	}

	public isCurve(curve: ECDSANamedCurve): boolean {
		return this.curve.objectIdentifier === curve.objectIdentifier;
	}

	public encodeSEC1Uncompressed(): Uint8Array {
		const bytes = new Uint8Array(1 + this.curve.size * 2);
		bytes[0] = 0x04;
		const xBytes = bigIntBytes(this.x);
		const yBytes = bigIntBytes(this.y);
		bytes.set(xBytes, 1 + this.curve.size - xBytes.byteLength);
		bytes.set(yBytes, 1 + this.curve.size);
		return bytes;
	}

	public encodeSEC1Compressed(): Uint8Array {
		const bytes = new Uint8Array(1 + this.curve.size);
		if (this.y % 2n === 0n) {
			bytes[0] = 0x02;
		} else {
			bytes[0] = 0x03;
		}
		const xBytes = bigIntBytes(this.x);
		bytes.set(xBytes, 1 + this.curve.size - xBytes.byteLength);
		return bytes;
	}

	public encodePKIXUncompressed(): Uint8Array {
		const algorithmIdentifier = new ASN1EncodableSequence([
			new ASN1ObjectIdentifier(encodeObjectIdentifier('1.2.840.10045.2.1')),
			new ASN1ObjectIdentifier(encodeObjectIdentifier(this.curve.objectIdentifier)),
		]);
		const encoded = this.encodeSEC1Uncompressed();
		const subjectPublicKey = new ASN1BitString(encoded, encoded.byteLength * 8);
		const subjectPublicKeyInfo = new ASN1EncodableSequence([algorithmIdentifier, subjectPublicKey]);
		return encodeASN1(subjectPublicKeyInfo);
	}

	public encodePKIXCompressed(): Uint8Array {
		const algorithmIdentifier = new ASN1EncodableSequence([
			new ASN1ObjectIdentifier(encodeObjectIdentifier('1.2.840.10045.2.1')),
			new ASN1ObjectIdentifier(encodeObjectIdentifier(this.curve.objectIdentifier)),
		]);
		const encoded = this.encodeSEC1Compressed();
		const subjectPublicKey = new ASN1BitString(encoded, encoded.byteLength * 8);
		const subjectPublicKeyInfo = new ASN1EncodableSequence([algorithmIdentifier, subjectPublicKey]);
		return encodeASN1(subjectPublicKeyInfo);
	}
}

export function decodeSEC1PublicKey(curve: ECDSANamedCurve, bytes: Uint8Array): ECDSAPublicKey {
	if (bytes.byteLength < 1) {
		throw new Error('Invalid public key');
	}
	if (bytes[0] === 0x04) {
		if (bytes.byteLength !== curve.size * 2 + 1) {
			throw new Error('Invalid public key');
		}
		const x = bigIntFromBytes(bytes.slice(1, curve.size + 1));
		const y = bigIntFromBytes(bytes.slice(curve.size + 1));
		return new ECDSAPublicKey(curve, x, y);
	}
	if (bytes[0] === 0x02) {
		if (bytes.byteLength !== curve.size + 1) {
			throw new Error('Invalid public key');
		}
		const x = bigIntFromBytes(bytes.slice(1));
		const y2 = euclideanMod(x ** 3n + curve.a * x + curve.b, curve.p);
		const y = tonelliShanks(y2, curve.p);
		if (y % 2n === 0n) {
			return new ECDSAPublicKey(curve, x, y);
		}
		return new ECDSAPublicKey(curve, x, curve.p - y);
	}
	if (bytes[0] === 0x03) {
		if (bytes.byteLength !== curve.size + 1) {
			throw new Error('Invalid public key');
		}
		const x = bigIntFromBytes(bytes.slice(1));
		const y2 = euclideanMod(x ** 3n + curve.a * x + curve.b, curve.p);
		const y = tonelliShanks(y2, curve.p);
		if (y % 2n === 1n) {
			return new ECDSAPublicKey(curve, x, y);
		}
		return new ECDSAPublicKey(curve, x, curve.p - y);
	}
	throw new Error('Unknown encoding format');
}

export class ECDSASignature {
	public r: bigint;
	public s: bigint;

	constructor(r: bigint, s: bigint) {
		if (r < 1n || s < 1n) {
			throw new TypeError('Invalid signature');
		}
		this.r = r;
		this.s = s;
	}

	public encodeIEEEP1363(curve: ECDSANamedCurve): Uint8Array {
		const rs = new Uint8Array(curve.size * 2);
		const rBytes = bigIntBytes(this.r);
		if (rBytes.byteLength > curve.size) {
			throw new Error("'r' is too large");
		}
		const sBytes = bigIntBytes(this.s);
		if (rBytes.byteLength > curve.size) {
			throw new Error("'s' is too large");
		}
		rs.set(rBytes, curve.size - rBytes.byteLength);
		rs.set(sBytes, rs.byteLength - sBytes.byteLength);
		return rs;
	}

	public encodePKIX(): Uint8Array {
		const asn1 = new ASN1EncodableSequence([new ASN1Integer(this.r), new ASN1Integer(this.s)]);
		return encodeASN1(asn1);
	}
}

export function decodeIEEEP1363ECDSASignature(
	curve: ECDSANamedCurve,
	bytes: Uint8Array
): ECDSASignature {
	if (bytes.byteLength !== curve.size * 2) {
		throw new Error('Failed to decode signature: Invalid signature size');
	}
	const r = bigIntFromBytes(bytes.slice(0, curve.size));
	const s = bigIntFromBytes(bytes.slice(curve.size));
	return new ECDSASignature(r, s);
}

export function decodePKIXECDSASignature(der: Uint8Array): ECDSASignature {
	try {
		const sequence = parseASN1NoLeftoverBytes(der).sequence();
		return new ECDSASignature(sequence.at(0).integer().value, sequence.at(1).integer().value);
	} catch {
		throw new Error('Failed to decode signature');
	}
}

export function decodePKIXECDSAPublicKey(
	bytes: Uint8Array,
	curves: ECDSANamedCurve[]
): ECDSAPublicKey {
	let algorithmIdentifierObjectIdentifier: ASN1ObjectIdentifier;
	let algorithmIdentifierParameter: ASN1ObjectIdentifier;
	let asn1PublicKey: ASN1BitString;
	try {
		const subjectPublicKeyInfo = parseASN1NoLeftoverBytes(bytes).sequence();
		const algorithmIdentifier = subjectPublicKeyInfo.at(0).sequence();
		algorithmIdentifierObjectIdentifier = algorithmIdentifier.at(0).objectIdentifier();
		algorithmIdentifierParameter = algorithmIdentifier.at(1).objectIdentifier();
		asn1PublicKey = subjectPublicKeyInfo.at(1).bitString();
	} catch {
		throw new Error('Failed to decode elliptic curve public key');
	}
	if (!algorithmIdentifierObjectIdentifier.is('1.2.840.10045.2.1')) {
		throw new Error('Invalid algorithm');
	}
	for (const curve of curves) {
		if (algorithmIdentifierParameter.is(curve.objectIdentifier)) {
			return decodeSEC1PublicKey(curve, asn1PublicKey.bytes);
		}
	}
	throw new Error('No matching curves');
}
