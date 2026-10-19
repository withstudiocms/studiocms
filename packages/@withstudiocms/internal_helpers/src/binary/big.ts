export function bigIntBytes(value: bigint): Uint8Array {
	if (value < 0n) {
		value = value * -1n;
	}
	let byteLength = 1;
	while (value > 2n ** BigInt(byteLength * 8) - 1n) {
		byteLength++;
	}
	const encoded = new Uint8Array(byteLength);
	for (let i = 0; i < encoded.byteLength; i++) {
		encoded[i] = Number((value >> BigInt((encoded.byteLength - i - 1) * 8)) & 0xffn);
	}
	return encoded;
}

export function bigIntFromBytes(bytes: Uint8Array): bigint {
	if (bytes.byteLength < 1) {
		throw new TypeError('Empty Uint8Array');
	}
	let decoded = 0n;
	for (let i = 0; i < bytes.byteLength; i++) {
		decoded += BigInt(bytes[i]) << BigInt((bytes.byteLength - 1 - i) * 8);
	}
	return decoded;
}
