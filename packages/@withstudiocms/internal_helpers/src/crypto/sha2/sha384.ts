import type { Hash } from '../hash/index.js';
import { SharedSHA512 } from './sha512.js';

export function sha384(data: Uint8Array): Uint8Array {
	const hash = new SHA384();
	hash.update(data);
	return hash.digest();
}

export class SHA384 implements Hash {
	public blockSize = 128;
	public size = 48;

	private sha512 = new SharedSHA512(
		new BigUint64Array([
			0xcbbb9d5dc1059ed8n,
			0x629a292a367cd507n,
			0x9159015a3070dd17n,
			0x152fecd8f70e5939n,
			0x67332667ffc00b31n,
			0x8eb44a8768581511n,
			0xdb0c2e0d64f98fa7n,
			0x47b5481dbefa4fa4n,
		])
	);

	public update(data: Uint8Array): void {
		this.sha512.update(data);
	}

	public digest(): Uint8Array {
		const result = new Uint8Array(48);
		this.sha512.putDigest(result);
		return result;
	}
}
