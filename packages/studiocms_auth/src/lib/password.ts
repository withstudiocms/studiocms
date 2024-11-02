import { checkIfUnsafe } from '@matthiesenxyz/integration-utils/securityUtils';
import { sha1 } from '@oslojs/crypto/sha1';
import { encodeHexLowerCase } from '@oslojs/encoding';
import bcrypt from 'bcryptjs';

export async function hashPassword(password: string): Promise<string> {
	const hashedPassword = await bcrypt.hash(password, 10);
	return hashedPassword;
}

export async function verifyPasswordHash(hash: string, password: string): Promise<boolean> {
	const passwordMatch = await bcrypt.compare(password, hash);
	return passwordMatch;
}

export async function verifyPasswordStrength(password: string): Promise<boolean> {
	// Password must be between 6 ~ 255 characters
	if (password.length < 6 || password.length > 255) {
		return false;
	}

	// Check if password is known unsafe password
	const isUnsafe = checkIfUnsafe(password).password();
	if (isUnsafe) {
		return false;
	}

	// Check if password is in pwned password database
	const hash = encodeHexLowerCase(sha1(new TextEncoder().encode(password)));
	const hashPrefix = hash.slice(0, 5);
	const response = await fetch(`https://api.pwnedpasswords.com/range/${hashPrefix}`);
	const data = await response.text();
	const lines = data.split('\n');
	for (const line of lines) {
		const hashSuffix = line.slice(0, 35).toLowerCase();
		if (hash === hashPrefix + hashSuffix) {
			return false;
		}
	}

	// Password is strong/secure enough
	return true;
}
