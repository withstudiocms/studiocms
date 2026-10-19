export function bigIntTwosComplementBytes(value: bigint): Uint8Array {
	if (value === 0n) {
		return new Uint8Array(1);
	}
	let byteLength = 1;
	if (value > 0n) {
		while (value > (1n << BigInt(byteLength * 8 - 1)) - 1n) {
			byteLength++;
		}
	} else {
		while (value < -1n << BigInt(byteLength * 8 - 1)) {
			byteLength++;
		}
	}
	const encoded = new Uint8Array(byteLength);
	for (let i = 0; i < encoded.byteLength; i++) {
		encoded[i] = Number((value >> BigInt((encoded.byteLength - i - 1) * 8)) & 0xffn);
	}
	return encoded;
}

export function bigIntFromTwosComplementBytes(bytes: Uint8Array): bigint {
	if (bytes.byteLength < 1) {
		throw new TypeError('Empty Uint8Array');
	}
	let decoded = 0n;
	for (let i = 0; i < bytes.byteLength; i++) {
		decoded += BigInt(bytes[i]) << BigInt((bytes.byteLength - 1 - i) * 8);
	}
	if (bytes[0] >> 7 === 0) {
		return decoded;
	}
	return decoded - (1n << BigInt(bytes.byteLength * 8));
}

export function variableLengthQuantityBytes(value: bigint): Uint8Array {
	let bitLength = 7;
	while (value > (1 << bitLength) - 1) {
		bitLength += 7;
	}
	const encoded = new Uint8Array(Math.ceil(bitLength / 8));
	for (let i = 0; i < encoded.byteLength; i++) {
		if (i === encoded.byteLength - 1) {
			encoded[i] = Number((value >> BigInt((encoded.byteLength - i - 1) * 7)) & 0x7fn);
		} else {
			encoded[i] = Number((value >> BigInt((encoded.byteLength - i - 1) * 7)) & 0x7fn) | 0x80;
		}
	}
	return encoded;
}

export function variableLengthQuantityFromBytes(
	bytes: Uint8Array,
	maxBytes: number
): [value: bigint, size: number] {
	let value = 0n;
	for (let i = 0; i < bytes.byteLength; i++) {
		value = (value << 7n) | BigInt(bytes[i] & 0x7f);
		if (bytes[i] >> 7 === 0) {
			return [value, i + 1];
		}
		if (i + 1 > maxBytes) {
			throw new Error('Data too large');
		}
	}
	throw new TypeError('Invalid variable length quantity');
}
