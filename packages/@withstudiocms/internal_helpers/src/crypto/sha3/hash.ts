import type { Hash } from '../hash/index.js';
import { SHA3 } from './sha3.js';

export function sha3_224(data: Uint8Array): Uint8Array {
	const hash = new SHA3_224();
	hash.update(data);
	return hash.digest();
}

export function sha3_256(data: Uint8Array): Uint8Array {
	const hash = new SHA3_256();
	hash.update(data);
	return hash.digest();
}

export function sha3_384(data: Uint8Array): Uint8Array {
	const hash = new SHA3_384();
	hash.update(data);
	return hash.digest();
}

export function sha3_512(data: Uint8Array): Uint8Array {
	const hash = new SHA3_512();
	hash.update(data);
	return hash.digest();
}

export class SHA3_224 implements Hash {
	public blockSize = 144;
	public size = 28;

	private sha3 = new SHA3(this.blockSize, this.size);

	public update(data: Uint8Array): void {
		this.sha3.absorb(data);
	}

	public digest(): Uint8Array {
		return this.sha3.squeeze();
	}
}

export class SHA3_256 implements Hash {
	public blockSize = 136;
	public size = 32;

	private sha3 = new SHA3(this.blockSize, this.size);

	public update(data: Uint8Array): void {
		this.sha3.absorb(data);
	}

	public digest(): Uint8Array {
		return this.sha3.squeeze();
	}
}

export class SHA3_384 implements Hash {
	public blockSize = 104;
	public size = 48;

	private sha3 = new SHA3(this.blockSize, this.size);

	public update(data: Uint8Array): void {
		this.sha3.absorb(data);
	}

	public digest(): Uint8Array {
		return this.sha3.squeeze();
	}
}

export class SHA3_512 implements Hash {
	public blockSize = 72;
	public size = 64;

	private sha3 = new SHA3(this.blockSize, this.size);

	public update(data: Uint8Array): void {
		this.sha3.absorb(data);
	}

	public digest(): Uint8Array {
		return this.sha3.squeeze();
	}
}
