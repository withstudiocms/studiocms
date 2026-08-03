import {
	ASN1BitString,
	ASN1EncodableSequence,
	ASN1Integer,
	ASN1Null,
	ASN1ObjectIdentifier,
	ASN1OctetString,
	ASN1UniversalType,
	type ASN1Value,
	encodeASN1,
	encodeObjectIdentifier,
	parseASN1NoLeftoverBytes,
} from '../../asn1/index.js';
import { bigIntFromBytes, concatenateBytes, DynamicBuffer } from '../../binary/index.js';
import type { HashAlgorithm } from '../hash/index.js';
import { constantTimeEqual } from '../subtle/index.js';

export function verifyRSASSAPKCS1v15Signature(
	publicKey: RSAPublicKey,
	hashObjectIdentifier: string,
	hashed: Uint8Array,
	signature: Uint8Array
): boolean {
	const s = bigIntFromBytes(signature);
	const m = powmod(s, publicKey.e, publicKey.n);
	const em = new Uint8Array(Math.ceil((publicKey.n.toString(2).length - 1) / 8));
	for (let i = 0; i < em.byteLength; i++) {
		em[i] = Number((m >> BigInt((em.byteLength - i - 1) * 8)) & 0xffn);
	}
	const t = encodeASN1(
		new ASN1EncodableSequence([
			new ASN1EncodableSequence([
				new ASN1ObjectIdentifier(encodeObjectIdentifier(hashObjectIdentifier)),
				new ASN1Null(),
			]),
			new ASN1OctetString(hashed),
		])
	);
	if (em.byteLength < t.byteLength + 11) {
		return false;
	}
	const ps = new Uint8Array(em.byteLength - t.byteLength - 3).fill(0xff);
	const emPrime = new DynamicBuffer(0);
	emPrime.writeByte(0x00);
	emPrime.writeByte(0x01);
	emPrime.write(ps);
	emPrime.writeByte(0x00);
	emPrime.write(t);
	return constantTimeEqual(em, emPrime.bytes());
}

export function verifyRSASSAPSSSignature(
	publicKey: RSAPublicKey,
	MessageHashAlgorithm: HashAlgorithm,
	MGF1HashAlgorithm: HashAlgorithm,
	saltLength: number,
	hashed: Uint8Array,
	signature: Uint8Array
): boolean {
	const s = bigIntFromBytes(signature);
	if (s < 0 || s >= publicKey.n) {
		return false;
	}
	const m = powmod(s, publicKey.e, publicKey.n);
	const maximalEMBits = publicKey.n.toString(2).length - 1;
	const em = new Uint8Array(Math.ceil(maximalEMBits / 8));
	for (let i = 0; i < em.byteLength; i++) {
		em[i] = Number((m >> BigInt((em.byteLength - i - 1) * 8)) & 0xffn);
	}

	if (em.byteLength < hashed.byteLength + saltLength + 2) {
		return false;
	}
	if (em[em.byteLength - 1] !== 0xbc) {
		return false;
	}

	const db = em.slice(0, em.byteLength - hashed.byteLength - 1);
	const h = em.slice(em.byteLength - hashed.byteLength - 1, em.byteLength - 1);
	if (db[0] >> (8 - (8 * em.byteLength - maximalEMBits)) !== 0) {
		return false;
	}

	const dbMask = mgf1(MGF1HashAlgorithm, h, em.byteLength - hashed.byteLength - 1);
	for (let i = 0; i < db.byteLength; i++) {
		db[i] ^= dbMask[i];
	}
	for (let i = 0; i < Math.floor((em.byteLength - hashed.byteLength - 1) / 8); i++) {
		db[i] = 0;
	}
	db[Math.floor((em.byteLength - hashed.byteLength - 1) / 8)] &=
		(1 << (8 - ((em.byteLength - hashed.byteLength - 1) % 8))) - 1;
	const salt = db.slice(db.byteLength - saltLength);
	const mPrime = new DynamicBuffer(8 + hashed.byteLength + saltLength);
	mPrime.write(new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]));
	mPrime.write(hashed);
	mPrime.write(salt);
	const hPrimeHash = new MessageHashAlgorithm();
	hPrimeHash.update(mPrime.bytes());
	return constantTimeEqual(h, hPrimeHash.digest());
}

export class RSAPublicKey {
	public n: bigint;
	public e: bigint;

	constructor(n: bigint, e: bigint) {
		this.n = n;
		this.e = e;
	}

	public encodePKCS1(): Uint8Array {
		const asn1 = new ASN1EncodableSequence([new ASN1Integer(this.n), new ASN1Integer(this.e)]);
		return encodeASN1(asn1);
	}

	public encodePKIX(): Uint8Array {
		const algorithmIdentifier = new ASN1EncodableSequence([
			new ASN1ObjectIdentifier(encodeObjectIdentifier('1.2.840.113549.1.1.1')),
			new ASN1Null(),
		]);
		const encoded = this.encodePKCS1();
		const subjectPublicKey = new ASN1BitString(encoded, encoded.byteLength * 8);
		const subjectPublicKeyInfo = new ASN1EncodableSequence([algorithmIdentifier, subjectPublicKey]);
		return encodeASN1(subjectPublicKeyInfo);
	}
}

export function decodePKCS1RSAPublicKey(pkcs1: Uint8Array): RSAPublicKey {
	try {
		const asn1PublicKey = parseASN1NoLeftoverBytes(pkcs1).sequence();
		return new RSAPublicKey(
			asn1PublicKey.at(0).integer().value,
			asn1PublicKey.at(1).integer().value
		);
	} catch {
		throw new Error('Invalid public key');
	}
}

export function decodePKIXRSAPublicKey(pkix: Uint8Array): RSAPublicKey {
	let asn1Algorithm: ASN1ObjectIdentifier;
	let asn1Parameter: ASN1Value;
	let asn1PublicKey: ASN1BitString;
	try {
		const asn1SubjectPublicKeyInfo = parseASN1NoLeftoverBytes(pkix).sequence();
		const asn1AlgorithmIdentifier = asn1SubjectPublicKeyInfo.at(0).sequence();
		asn1Algorithm = asn1AlgorithmIdentifier.at(0).objectIdentifier();
		asn1Parameter = asn1AlgorithmIdentifier.at(1);
		asn1PublicKey = asn1SubjectPublicKeyInfo.at(1).bitString();
	} catch {
		throw new Error('Failed to parse SubjectPublicKeyInfo');
	}
	// TODO: Should other (more-specific) OIDs be supported?
	if (!asn1Algorithm.is('1.2.840.113549.1.1.1')) {
		throw new Error('Invalid public key OID');
	}
	if (asn1Parameter.universalType() !== ASN1UniversalType.Null) {
		throw new Error('Invalid public key');
	}
	try {
		return decodePKCS1RSAPublicKey(asn1PublicKey.bytes);
	} catch {
		throw new Error('Invalid public key');
	}
}

export const sha1ObjectIdentifier = '1.3.14.3.2.26';
export const sha224ObjectIdentifier = '2.16.840.1.101.3.4.2.4';
export const sha256ObjectIdentifier = '2.16.840.1.101.3.4.2.1';
export const sha384ObjectIdentifier = '2.16.840.1.101.3.4.2.2';
export const sha512ObjectIdentifier = '2.16.840.1.101.3.4.2.3';

function mgf1(Hash: HashAlgorithm, Z: Uint8Array, l: number): Uint8Array {
	let t = new Uint8Array();
	let counter = 0;
	while (t.byteLength < l) {
		const counterBytes = new Uint8Array(4);
		for (let j = 0; j < counterBytes.byteLength; j++) {
			counterBytes[j] = Number((counter >> ((counterBytes.byteLength - j - 1) * 8)) & 0xff);
		}
		const zcHash = new Hash();
		zcHash.update(Z);
		zcHash.update(counterBytes);
		t = concatenateBytes(t, zcHash.digest());
		counter++;
	}
	return t.slice(0, l);
}

function powmod(x: bigint, y: bigint, p: bigint): bigint {
	let res = 1n; // Initialize result
	x = x % p;
	while (y > 0) {
		if (y % 2n === 1n) {
			res = euclideanMod(res * x, p);
		}
		y = y >> 1n;
		x = euclideanMod(x * x, p);
	}
	return res;
}

function euclideanMod(x: bigint, y: bigint): bigint {
	const r = x % y;
	if (r < 0n) {
		return r + y;
	}
	return r;
}
