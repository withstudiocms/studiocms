import * as crypto from 'node:crypto';
import logger from 'studiocms:logger';

function base64UrlEncode(input: string): string {
	return Buffer.from(input)
		.toString('base64') // convert to base64
		.replace(/\+/g, '-') // replace '+' with '-'
		.replace(/\//g, '_') // replace '/' with '_'
		.replace(/=+$/, ''); // remove any trailing '='
}

function base64UrlDecode(input: string): string {
	let newInput = input.replace(/-/g, '+').replace(/_/g, '/');
	while (newInput.length % 4 !== 0) {
		newInput += '=';
	}
	return Buffer.from(newInput, 'base64').toString();
}

export interface JwtVerificationResult {
	isValid: boolean;
	userId?: string; // Optional, as the userId might not be available if the token is invalid
}

export function generateJwt(
	secret: string,
	payload: { userId: string },
	noExpire?: boolean
): string {
	const header = { alg: 'HS256', typ: 'JWT' };

	const currentDate = new Date();
	const thirtyYearsFromToday = Math.floor(
		currentDate.setFullYear(currentDate.getFullYear() + 30) / 1000
	);

	const exp = noExpire ? thirtyYearsFromToday : Math.floor(Date.now() / 1000) + 86400; // 24 hours in seconds

	const payloadObj = {
		...payload,
		iat: Math.floor(Date.now() / 1000), // Corrected iat
		exp,
	};

	const encodedHeader = base64UrlEncode(JSON.stringify(header));
	const encodedPayload = base64UrlEncode(JSON.stringify(payloadObj));

	const signatureInput = `${encodedHeader}.${encodedPayload}`;
	const signature = Buffer.from(
		crypto
			.createHmac('sha256', secret + secret)
			.update(signatureInput)
			.digest()
	).toString('base64url');

	return `${encodedHeader}.${encodedPayload}.${signature}`;
}

export function verifyJwt(token: string, secret: string): JwtVerificationResult {
	const [encodedHeader, encodedPayload, encodedSignature] = token.split('.');

	const header = JSON.parse(base64UrlDecode(encodedHeader));
	const payload = JSON.parse(base64UrlDecode(encodedPayload));

	// Check if algorithm is correct
	if (header.alg !== 'HS256') {
		logger.warn('Invalid algorithm');
		return { isValid: false };
	}

	const currentTime = Math.floor(Date.now() / 1000);
	if (payload.exp && currentTime > payload.exp) {
		logger.warn('Token has expired');
		return { isValid: false };
	}

	const signatureInput = `${encodedHeader}.${encodedPayload}`;
	const generatedSignature = Buffer.from(
		crypto
			.createHmac('sha256', secret + secret)
			.update(signatureInput)
			.digest()
	).toString('base64url');

	if (generatedSignature !== encodedSignature) {
		logger.warn('Invalid signature');
		return { isValid: false };
	}

	logger.info('Token is valid');
	return { isValid: true, userId: payload.userId };
}
