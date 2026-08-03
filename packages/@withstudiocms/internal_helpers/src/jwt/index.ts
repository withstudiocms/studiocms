import {
	decodeBase64,
	decodeBase64urlIgnorePadding,
	encodeBase64urlNoPadding,
} from '../encoding/index.js';

export function parseJWT(
	jwt: string
): [header: object, payload: object, signature: Uint8Array, signatureMessage: Uint8Array] {
	const parts = jwt.split('.');
	if (parts.length !== 3) {
		throw new Error('Invalid JWT');
	}
	let jsonHeader: string;
	let jsonPayload: string;
	let signature: Uint8Array;
	try {
		jsonHeader = new TextDecoder().decode(decodeBase64urlIgnorePadding(parts[0]));
		jsonPayload = new TextDecoder().decode(decodeBase64urlIgnorePadding(parts[1]));
		signature = decodeBase64urlIgnorePadding(parts[2]);
	} catch {
		throw new Error('Invalid JWT: Invalid base64url encoding');
	}
	let header: unknown;
	let payload: unknown;
	try {
		header = JSON.parse(jsonHeader);
		payload = JSON.parse(jsonPayload);
	} catch {
		throw new Error('Invalid JWT: Invalid JSON encoding');
	}
	if (typeof header !== 'object' || header === null) {
		throw new Error('Invalid JWT: Invalid header');
	}
	if (typeof payload !== 'object' || payload === null) {
		throw new Error('Invalid JWT: Invalid payload');
	}
	const signatureMessage = new TextEncoder().encode(parts[0] + '.' + parts[1]);
	return [header as object, payload as object, signature, signatureMessage];
}

export function decodeJWT(jwt: string): object {
	const parts = jwt.split('.');
	if (parts.length !== 3) {
		throw new Error('Invalid JWT');
	}
	let jsonPayload: string;
	try {
		jsonPayload = new TextDecoder().decode(decodeBase64urlIgnorePadding(parts[1]));
	} catch {
		throw new Error('Invalid JWT: Invalid base64url encoding');
	}
	let payload: unknown;
	try {
		payload = JSON.parse(jsonPayload);
	} catch {
		throw new Error('Invalid JWT: Invalid JSON encoding');
	}
	if (typeof payload !== 'object' || payload === null) {
		throw new Error('Invalid JWT: Invalid payload');
	}
	return payload as object;
}

export function encodeJWT(headerJSON: string, payloadJSON: string, signature: Uint8Array): string {
	const encodedHeader = encodeBase64urlNoPadding(new TextEncoder().encode(headerJSON));
	const encodedPayload = encodeBase64urlNoPadding(new TextEncoder().encode(payloadJSON));
	const encodedSignature = encodeBase64urlNoPadding(signature);
	const jwt = encodedHeader + '.' + encodedPayload + '.' + encodedSignature;
	return jwt;
}

export function createJWTSignatureMessage(headerJSON: string, payloadJSON: string): Uint8Array {
	const encodedHeader = encodeBase64urlNoPadding(new TextEncoder().encode(headerJSON));
	const encodedPayload = encodeBase64urlNoPadding(new TextEncoder().encode(payloadJSON));
	const message = encodedHeader + '.' + encodedPayload;
	return new TextEncoder().encode(message);
}

export class JWTRegisteredClaims {
	private target: object;

	constructor(target: object) {
		this.target = target;
	}

	public hasIssuer(): boolean {
		return 'iss' in this.target;
	}

	public issuer(): string {
		if ('iss' in this.target && typeof this.target.iss === 'string') {
			return this.target.iss;
		}
		throw new Error("Invalid or missing 'iss' claim");
	}

	public hasSubject(): boolean {
		return 'sub' in this.target;
	}

	public subject(): string {
		if ('sub' in this.target && typeof this.target.sub === 'string') {
			return this.target.sub;
		}
		throw new Error("Invalid or missing 'sub' claim");
	}

	public hasAudiences(): boolean {
		return 'aud' in this.target;
	}

	public audiences(): string[] {
		if ('aud' in this.target && typeof this.target.aud === 'string') {
			const audiences = [this.target.aud];
			return audiences;
		}
		if ('aud' in this.target && Array.isArray(this.target.aud)) {
			for (const audience in this.target.aud) {
				if (typeof audience !== 'string') {
					throw new Error("Invalid or missing 'aud' claim");
				}
			}
			return this.target.aud as string[];
		}
		throw new Error("Invalid or missing 'aud' claim");
	}

	public hasExpiration(): boolean {
		return 'exp' in this.target;
	}

	public expiration(): Date {
		if (
			'exp' in this.target &&
			typeof this.target.exp === 'number' &&
			this.target.exp >= 0 &&
			Number.isInteger(this.target.exp)
		) {
			return new Date(this.target.exp * 1000);
		}
		throw new Error("Invalid or missing 'exp' claim");
	}

	public verifyExpiration(): boolean {
		if (
			'exp' in this.target &&
			typeof this.target.exp === 'number' &&
			this.target.exp >= 0 &&
			Number.isInteger(this.target.exp)
		) {
			return Date.now() < this.target.exp * 1000;
		}
		throw new Error("Invalid or missing 'exp' claim");
	}

	public hasNotBefore(): boolean {
		return 'nbf' in this.target;
	}

	public notBefore(): Date {
		if (
			'nbf' in this.target &&
			typeof this.target.nbf === 'number' &&
			this.target.nbf >= 0 &&
			Number.isInteger(this.target.nbf)
		) {
			return new Date(this.target.nbf * 1000);
		}
		throw new Error("Invalid or missing 'nbf' claim");
	}

	public verifyNotBefore(): boolean {
		if (
			'nbf' in this.target &&
			typeof this.target.nbf === 'number' &&
			this.target.nbf >= 0 &&
			Number.isInteger(this.target.nbf)
		) {
			return Date.now() >= this.target.nbf * 1000;
		}
		throw new Error("Invalid or missing 'nbf' claim");
	}

	public hasIssuedAt(): boolean {
		return 'iat' in this.target;
	}

	public issuedAt(): Date {
		if (
			'iat' in this.target &&
			typeof this.target.iat === 'number' &&
			this.target.iat >= 0 &&
			Number.isInteger(this.target.iat)
		) {
			return new Date(this.target.iat * 1000);
		}
		throw new Error("Invalid or missing 'iat' claim");
	}

	public hasJWTId(): boolean {
		return 'jti' in this.target;
	}

	public jwtId(): string {
		if ('jti' in this.target && typeof this.target.jti === 'string') {
			return this.target.jti;
		}
		throw new Error("Invalid or missing 'jti' claim");
	}
}

export class JWSRegisteredHeaders {
	private target: object;

	constructor(target: object) {
		this.target = target;
	}

	public hasAlgorithm(): boolean {
		return 'alg' in this.target;
	}

	public algorithm(): string {
		if ('alg' in this.target && typeof this.target.alg === 'string') {
			return this.target.alg;
		}
		throw new Error("Invalid or missing 'alg' claim");
	}

	public hasJWKSetURL(): boolean {
		return 'jku' in this.target;
	}

	public jwkSetURL(): string {
		if ('jku' in this.target && typeof this.target.jku === 'string') {
			return this.target.jku;
		}
		throw new Error("Invalid or missing 'jku' claim");
	}

	public hasJWK(): boolean {
		return 'jwk' in this.target;
	}

	public jwk(): string {
		if ('jwk' in this.target && typeof this.target.jwk === 'string') {
			return this.target.jwk;
		}
		throw new Error("Invalid or missing 'jwk' claim");
	}

	public hasKeyId(): boolean {
		return 'kid' in this.target;
	}

	public keyId(): string {
		if ('kid' in this.target && typeof this.target.kid === 'string') {
			return this.target.kid;
		}
		throw new Error("Invalid or missing 'kid' claim");
	}

	public hasX509URL(): boolean {
		return 'x5u' in this.target;
	}

	public x509URL(): string {
		if ('x5u' in this.target && typeof this.target.x5u === 'string') {
			return this.target.x5u;
		}
		throw new Error("Invalid or missing 'x5u' claim");
	}

	public hasX509CertificateChain(): boolean {
		return 'x5c' in this.target;
	}

	public x509CertificateChain(): Uint8Array[] {
		if ('x5c' in this.target && Array.isArray(this.target.x5c)) {
			if (this.target.x5c.length === 0) {
				throw new Error("Invalid or missing 'x5c' claim");
			}
			const chain: Uint8Array[] = [];
			for (const encoded of this.target.x5c) {
				if (typeof encoded !== 'string') {
					throw new Error("Invalid or missing 'x5c' claim");
				}
				try {
					chain.push(decodeBase64(encoded));
				} catch {
					throw new Error("Invalid or missing 'x5c' claim");
				}
			}
			return chain;
		}
		throw new Error("Invalid or missing 'x5c' claim");
	}

	public hasX509CertificateSHA1Thumbprint(): boolean {
		return 'x5t' in this.target;
	}

	public x509CertificateSHA1Thumbprint(): Uint8Array {
		if ('x5t' in this.target && typeof this.target.x5t === 'string') {
			try {
				const thumbprint = decodeBase64urlIgnorePadding(this.target.x5t);
				return thumbprint;
			} catch {
				throw new Error("Invalid or missing 'x5t' claim");
			}
		}
		throw new Error("Invalid or missing 'x5t' claim");
	}

	public hasX509CertificateSHA256Thumbprint(): boolean {
		return 'x5t#S256' in this.target;
	}

	public x509CertificateSHA256Thumbprint(): Uint8Array {
		if ('x5t#S256' in this.target && typeof this.target['x5t#S256'] === 'string') {
			try {
				const thumbprint = decodeBase64urlIgnorePadding(this.target['x5t#S256']);
				return thumbprint;
			} catch {
				throw new Error("Invalid or missing 'x5t#S256' claim");
			}
		}
		throw new Error("Invalid or missing 'x5t#S256' claim");
	}

	public hasType(): boolean {
		return 'typ' in this.target;
	}

	public type(): string {
		if ('typ' in this.target && typeof this.target.typ === 'string') {
			return this.target.typ;
		}
		throw new Error("Invalid or missing 'typ' claim");
	}

	public hasContentType(): boolean {
		return 'cty' in this.target;
	}

	public contentType(): string {
		if ('cty' in this.target && typeof this.target.cty === 'string') {
			return this.target.cty;
		}
		throw new Error("Invalid or missing 'cty' claim");
	}

	public hasCritical(): boolean {
		return 'crit' in this.target;
	}

	public critical(): string[] {
		if ('crit' in this.target && Array.isArray(this.target.crit)) {
			if (this.target.crit.length === 0) {
				throw new Error("Invalid or missing 'crit' claim");
			}
			for (const audience in this.target.crit) {
				if (typeof audience !== 'string') {
					throw new Error("Invalid or missing 'crit' claim");
				}
			}
			return this.target.crit as string[];
		}
		throw new Error("Invalid or missing 'crit' claim");
	}
}

export const joseAlgorithmHS256 = 'HS256';
export const joseAlgorithmES256 = 'ES256';
export const joseAlgorithmRS256 = 'RS256';
