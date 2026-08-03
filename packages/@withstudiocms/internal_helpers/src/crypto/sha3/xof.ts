import type { Hash } from '../hash/index.js';
import { SHA3XOF } from './sha3.js';

export function shake128(size: number, data: Uint8Array): Uint8Array {
	const hash = new SHAKE128(size);
	hash.update(data);
	return hash.digest();
}

export function shake256(size: number, data: Uint8Array): Uint8Array {
	const hash = new SHAKE256(size);
	hash.update(data);
	return hash.digest();
}

export class SHAKE128 implements Hash {
	public blockSize = 168;
	public size: number;

	private sha3: SHA3XOF;

	constructor(size: number) {
		if (size < 1) {
			throw new TypeError('Invalid hash size');
		}
		this.size = size;
		this.sha3 = new SHA3XOF(this.blockSize, this.size);
	}

	public update(data: Uint8Array): void {
		this.sha3.absorb(data);
	}

	public digest(): Uint8Array {
		return this.sha3.squeeze();
	}
}

export class SHAKE256 implements Hash {
	public blockSize = 136;
	public size: number;

	private sha3: SHA3XOF;

	constructor(size: number) {
		this.size = size;
		this.sha3 = new SHA3XOF(this.blockSize, this.size);
	}

	public update(data: Uint8Array): void {
		this.sha3.absorb(data);
	}

	public digest(): Uint8Array {
		return this.sha3.squeeze();
	}
}
