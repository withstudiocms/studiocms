export function decodeASCII(encoded: Uint8Array): string {
	for (let i = 0; i < encoded.byteLength; i++) {
		if (encoded[i] > 0x7f) {
			throw new TypeError('Invalid ASCII');
		}
	}
	return new TextDecoder().decode(encoded);
}
