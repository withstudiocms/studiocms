import * as crypto from 'node:crypto';

function base64UrlEncode(input: string): string {
	return Buffer.from(input)
		.toString('base64') // convert to base64
		.replace(/\+/g, '-') // replace '+' with '-'
		.replace(/\//g, '_') // replace '/' with '_'
		.replace(/=+$/, ''); // remove any trailing '='
}

function base64UrlDecode(input: string): string {
	// Replace URL-safe characters and decode from base64
	input = input.replace(/-/g, '+').replace(/_/g, '/');
	const padding = input.length % 4 === 0 ? '' : '='.repeat(4 - (input.length % 4));
	const decoded = Buffer.from(input + padding, 'base64').toString('utf8');
	return decoded;
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
	// 1. Header (JSON object)
	const header = {
		alg: 'HS256',
		typ: 'JWT',
	};

	const currentDate = new Date();
	const ThirtyYearsFromToday = new Date(currentDate.setFullYear(currentDate.getFullYear() + 30));

	const exp = noExpire
		? Math.floor(ThirtyYearsFromToday.getTime() / 1000)
		: Math.floor(Date.now() / 1000) + 86400; // 24 hours in seconds

	// 2. Payload (a simple payload can include a user ID, expiration time, etc.)
	const payloadObj = {
		...payload,
		iat: new Date().getTime(), // issued at time
		exp,
	};

	// 3. Encode Header and Payload
	const encodedHeader = base64UrlEncode(JSON.stringify(header));
	const encodedPayload = base64UrlEncode(JSON.stringify(payloadObj));

	// 4. Signature (using HMAC SHA256 with the secret)
	const signatureInput = `${encodedHeader}.${encodedPayload}`;
	const signature = crypto.createHmac('sha256', secret).update(signatureInput).digest('base64');

	const encodedSignature = base64UrlEncode(signature);

	// Return the complete JWT
	return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
}

export function verifyJwt(token: string, secret: string): JwtVerificationResult {
	// Split the token into its parts: Header, Payload, Signature
	const [encodedHeader, encodedPayload, encodedSignature] = token.split('.');

	// Base64 URL-decode the Header and Payload
	const header = JSON.parse(base64UrlDecode(encodedHeader));
	const payload = JSON.parse(base64UrlDecode(encodedPayload));

	// Check if the token has expired
	const currentTime = Math.floor(Date.now() / 1000);
	if (payload.exp && currentTime > payload.exp) {
		console.log('Token has expired');
		return { isValid: false };
	}

	// Recreate the signature to verify it
	const signatureInput = `${encodedHeader}.${encodedPayload}`;
	const signature = crypto.createHmac('sha256', secret).update(signatureInput).digest('base64');

	// Base64 URL-encode the recreated signature
	const encodedGeneratedSignature = base64UrlEncode(signature);

	// Compare the generated signature with the token's signature
	if (encodedGeneratedSignature !== encodedSignature) {
		console.log('Invalid signature');
		return { isValid: false };
	}

	// If the token is valid, return the userId from the payload
	return {
		isValid: true,
		userId: payload.userId, // Assuming `userId` exists in the payload
	};
}
