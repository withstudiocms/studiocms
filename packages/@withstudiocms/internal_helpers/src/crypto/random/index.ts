import { bigIntFromBytes } from '../../binary/index.js';

export function generateRandomInteger(random: RandomReader, max: bigint): bigint {
	if (max < 2) {
		throw new Error("Argument 'max' must be a positive integer larger than 1");
	}
	const inclusiveMaxBitLength = (max - 1n).toString(2).length;
	const shift = inclusiveMaxBitLength % 8;
	const bytes = new Uint8Array(Math.ceil(inclusiveMaxBitLength / 8));

	try {
		random.read(bytes);
	} catch (e) {
		throw new Error('Failed to retrieve random bytes', {
			cause: e,
		});
	}

	// This zeroes bits that can be ignored to increase the chance `result` < `max`.
	// For example, if `max` can be represented with 10 bits, the leading 6 bits of the random 16 bits (2 bytes) can be ignored.
	if (shift !== 0) {
		bytes[0] &= (1 << shift) - 1;
	}
	let result = bigIntFromBytes(bytes);
	while (result >= max) {
		try {
			random.read(bytes);
		} catch (e) {
			throw new Error('Failed to retrieve random bytes', {
				cause: e,
			});
		}
		if (shift !== 0) {
			bytes[0] &= (1 << shift) - 1;
		}
		result = bigIntFromBytes(bytes);
	}
	return result;
}

export function generateRandomIntegerNumber(random: RandomReader, max: number): number {
	if (max < 2 || max > Number.MAX_SAFE_INTEGER) {
		throw new Error("Argument 'max' must be a positive integer larger than 1");
	}
	return Number(generateRandomInteger(random, BigInt(max)));
}

export function generateRandomString(
	random: RandomReader,
	alphabet: string,
	length: number
): string {
	let result = '';
	for (let i = 0; i < length; i++) {
		result += alphabet[generateRandomIntegerNumber(random, alphabet.length)];
	}
	return result;
}

export interface RandomReader {
	read(bytes: Uint8Array): void;
}
