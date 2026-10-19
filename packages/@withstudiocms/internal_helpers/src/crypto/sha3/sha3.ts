import { rotl64 } from '../../binary/index.js';

export class SHA3 {
	private rate: number;
	private outputSize: number;
	private state = new BigUint64Array(25);
	private absorbedBytes = 0;

	constructor(rate: number, outputSize: number) {
		this.rate = rate;
		this.outputSize = outputSize;
	}

	public absorb(bytes: Uint8Array): void {
		for (let i = 0; i < bytes.byteLength; i++) {
			this.state[Math.floor(this.absorbedBytes / 8)] ^=
				BigInt(bytes[i]) << (BigInt(this.absorbedBytes % 8) * 8n);
			this.absorbedBytes++;
			if (this.absorbedBytes === this.rate) {
				keccak(this.state);
				this.absorbedBytes = 0;
			}
		}
	}

	public squeeze(): Uint8Array {
		this.state[Math.floor(this.absorbedBytes / 8)] ^=
			0x06n << (BigInt(this.absorbedBytes % 8) * 8n);
		this.state[Math.floor((this.rate - 1) / 8)] ^= 0x8000000000000000n;
		keccak(this.state);
		if (this.outputSize <= this.rate) {
			return new Uint8Array(this.state.buffer).slice(0, this.outputSize);
		}
		const keccakCount = Math.ceil(this.outputSize / this.rate);
		const z = new Uint8Array(keccakCount * this.rate);
		z.set(new Uint8Array(this.state.buffer).slice(0, this.rate));
		for (let i = 1; i < keccakCount; i++) {
			keccak(this.state);
			z.set(new Uint8Array(this.state.buffer).slice(0, this.rate), i * this.rate);
		}
		return z.slice(0, this.outputSize);
	}
}

export class SHA3XOF {
	private rate: number;
	private outputSize: number;
	private state = new BigUint64Array(25);
	private absorbedBytes = 0;

	constructor(rate: number, outputSize: number) {
		this.rate = rate;
		this.outputSize = outputSize;
	}

	public absorb(bytes: Uint8Array): void {
		for (let i = 0; i < bytes.byteLength; i++) {
			this.state[Math.floor(this.absorbedBytes / 8)] ^=
				BigInt(bytes[i]) << (BigInt(this.absorbedBytes % 8) * 8n);
			this.absorbedBytes++;
			if (this.absorbedBytes === this.rate) {
				keccak(this.state);
				this.absorbedBytes = 0;
			}
		}
	}

	public squeeze(): Uint8Array {
		this.state[Math.floor(this.absorbedBytes / 8)] ^=
			0x1fn << (BigInt(this.absorbedBytes % 8) * 8n);
		this.state[Math.floor((this.rate - 1) / 8)] ^= 0x8000000000000000n;
		keccak(this.state);
		if (this.outputSize <= this.rate) {
			return new Uint8Array(this.state.buffer).slice(0, this.outputSize);
		}
		const keccakCount = Math.ceil(this.outputSize / this.rate);
		const z = new Uint8Array(keccakCount * this.rate);
		z.set(new Uint8Array(this.state.buffer).slice(0, this.rate));
		for (let i = 1; i < keccakCount; i++) {
			keccak(this.state);
			z.set(new Uint8Array(this.state.buffer).slice(0, this.rate), i * this.rate);
		}
		return z.slice(0, this.outputSize);
	}
}

function keccak(a: BigUint64Array): void {
	for (let i = 0; i < 24; i++) {
		theta(a);
		rho(a);
		pi(a);
		chi(a);
		iota(a, i);
	}
}

function theta(a: BigUint64Array): void {
	const c = new BigUint64Array(5);
	for (let x = 0; x < 5; x++) {
		c[x] = a[x];
		c[x] ^= a[x + 5];
		c[x] ^= a[x + 10];
		c[x] ^= a[x + 15];
		c[x] ^= a[x + 20];
	}
	const d = new BigUint64Array(5);
	for (let x = 0; x < 5; x++) {
		d[x] = c[(x + 4) % 5] ^ rotl64(c[(x + 1) % 5], 1);
	}
	for (let x = 0; x < 5; x++) {
		for (let y = 0; y < 5; y++) {
			a[x + y * 5] ^= d[x];
		}
	}
}

function rho(a: BigUint64Array): void {
	// Lane (0, 0) stays the same
	const shifts = [
		0, 1, 62, 28, 27, 36, 44, 6, 55, 20, 3, 10, 43, 25, 39, 41, 45, 15, 21, 8, 18, 2, 61, 56, 14,
	];
	for (let i = 0; i < 25; i++) {
		a[i] = rotl64(a[i], shifts[i]);
	}
}

function pi(a: BigUint64Array): void {
	const dests = [
		0, 10, 20, 5, 15, 16, 1, 11, 21, 6, 7, 17, 2, 12, 22, 23, 8, 18, 3, 13, 14, 24, 9, 19, 4,
	];
	const temp = new BigUint64Array(a);
	for (let i = 0; i < 25; i++) {
		a[dests[i]] = temp[i];
	}
}

function chi(a: BigUint64Array): void {
	const temp = new BigUint64Array(a);
	for (let x = 0; x < 5; x++) {
		for (let y = 0; y < 5; y++) {
			a[x + 5 * y] ^= ~temp[((x + 1) % 5) + 5 * y] & temp[((x + 2) % 5) + 5 * y];
		}
	}
}

function iota(a: BigUint64Array, i: number): void {
	a[0] ^= iotaConstants[i];
}

const iotaConstants = new BigUint64Array([
	0x0000000000000001n,
	0x0000000000008082n,
	0x800000000000808an,
	0x8000000080008000n,
	0x000000000000808bn,
	0x0000000080000001n,
	0x8000000080008081n,
	0x8000000000008009n,
	0x000000000000008an,
	0x0000000000000088n,
	0x0000000080008009n,
	0x000000008000000an,
	0x000000008000808bn,
	0x800000000000008bn,
	0x8000000000008089n,
	0x8000000000008003n,
	0x8000000000008002n,
	0x8000000000000080n,
	0x000000000000800an,
	0x800000008000000an,
	0x8000000080008081n,
	0x8000000000008080n,
	0x0000000080000001n,
	0x8000000080008008n,
]);
