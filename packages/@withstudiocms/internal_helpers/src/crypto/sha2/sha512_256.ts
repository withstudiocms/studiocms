import type { Hash } from '../hash/index.js';
import { SharedSHA512 } from './sha512.js';

export function sha512_256(data: Uint8Array): Uint8Array {
	const hash = new SHA512_256();
	hash.update(data);
	return hash.digest();
}

export class SHA512_256 implements Hash {
	public blockSize = 128;
	public size = 28;

	private sha512 = new SharedSHA512(
		new BigUint64Array([
			0x22312194fc2bf72cn,
			0x9f555fa3c84c64c2n,
			0x2393b86b6f53b151n,
			0x963877195940eabdn,
			0x96283ee2a88effe3n,
			0xbe5e1e2553863992n,
			0x2b0199fc2c85b8aan,
			0x0eb72ddc81c52ca2n,
		])
	);

	public update(data: Uint8Array): void {
		this.sha512.update(data);
	}

	public digest(): Uint8Array {
		const result = new Uint8Array(32);
		this.sha512.putDigest(result);
		return result;
	}
}
