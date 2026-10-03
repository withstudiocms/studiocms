import type { Hash } from '../hash/index.js';
import { SharedSHA512 } from './sha512.js';

export function sha512_224(data: Uint8Array): Uint8Array {
	const hash = new SHA512_224();
	hash.update(data);
	return hash.digest();
}

export class SHA512_224 implements Hash {
	public blockSize = 128;
	public size = 28;

	private sha512 = new SharedSHA512(
		new BigUint64Array([
			0x8c3d37c819544da2n,
			0x73e1996689dcd4d6n,
			0x1dfab7ae32ff9c82n,
			0x679dd514582f9fcfn,
			0x0f6d2b697bd44da8n,
			0x77e36f7304c48942n,
			0x3f9d85a86a1d36c8n,
			0x1112e6ad91d692a1n,
		])
	);

	public update(data: Uint8Array): void {
		this.sha512.update(data);
	}

	public digest(): Uint8Array {
		// SharedSHA512.putDigest() expects byte array with a length of multiple of 8
		const result = new Uint8Array(32);
		this.sha512.putDigest(result);
		return result.slice(0, 28);
	}
}
