import { bigEndian, rotl32 } from '../../binary/index.js';

import type { Hash } from '../hash/index.js';

// Faster or comparable to Web Crypto < 2000 bytes.
export function sha1(data: Uint8Array): Uint8Array {
	const hash = new SHA1();
	hash.update(data);
	return hash.digest();
}

export class SHA1 implements Hash {
	public blockSize = 64;
	public size = 20;

	private blocks = new Uint8Array(64);
	private currentBlockSize = 0;
	private H = new Uint32Array([0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476, 0xc3d2e1f0]);
	private l = 0;
	private w = new Uint32Array(80);

	public update(data: Uint8Array): void {
		this.l += data.byteLength * 8;
		if (this.currentBlockSize + data.byteLength < 64) {
			this.blocks.set(data, this.currentBlockSize);
			this.currentBlockSize += data.byteLength;
			return;
		}
		let processed = 0;
		if (this.currentBlockSize > 0) {
			const next = data.slice(0, 64 - this.currentBlockSize);
			this.blocks.set(next, this.currentBlockSize);
			this.process();
			processed += next.byteLength;
			this.currentBlockSize = 0;
		}
		while (processed + 64 <= data.byteLength) {
			const next = data.slice(processed, processed + 64);
			this.blocks.set(next);
			this.process();
			processed += 64;
		}
		if (data.byteLength - processed > 0) {
			const remaining = data.slice(processed);
			this.blocks.set(remaining);
			this.currentBlockSize = remaining.byteLength;
		}
	}

	public digest(): Uint8Array {
		this.blocks[this.currentBlockSize] = 0x80;
		this.currentBlockSize += 1;
		if (64 - this.currentBlockSize < 8) {
			this.blocks.fill(0, this.currentBlockSize);
			this.process();
			this.currentBlockSize = 0;
		}
		this.blocks.fill(0, this.currentBlockSize);
		bigEndian.putUint64(this.blocks, BigInt(this.l), this.blockSize - 8);
		this.process();
		const result = new Uint8Array(20);
		for (let i = 0; i < 5; i++) {
			bigEndian.putUint32(result, this.H[i], i * 4);
		}
		return result;
	}

	private process(): void {
		for (let t = 0; t < 16; t++) {
			this.w[t] =
				((this.blocks[t * 4] << 24) |
					(this.blocks[t * 4 + 1] << 16) |
					(this.blocks[t * 4 + 2] << 8) |
					this.blocks[t * 4 + 3]) >>>
				0;
		}
		for (let t = 16; t < 80; t++) {
			this.w[t] = rotl32(
				(this.w[t - 3] ^ this.w[t - 8] ^ this.w[t - 14] ^ this.w[t - 16]) >>> 0,
				1
			);
		}
		let a = this.H[0];
		let b = this.H[1];
		let c = this.H[2];
		let d = this.H[3];
		let e = this.H[4];
		for (let t = 0; t < 80; t++) {
			let F: number;
			let K: number;
			if (t < 20) {
				F = ((b & c) ^ (~b & d)) >>> 0;
				K = 0x5a827999;
			} else if (t < 40) {
				F = (b ^ c ^ d) >>> 0;
				K = 0x6ed9eba1;
			} else if (t < 60) {
				F = ((b & c) ^ (b & d) ^ (c & d)) >>> 0;
				K = 0x8f1bbcdc;
			} else {
				F = (b ^ c ^ d) >>> 0;
				K = 0xca62c1d6;
			}
			const T = (rotl32(a, 5) + e + F + this.w[t] + K) | 0;
			e = d;
			d = c;
			c = rotl32(b, 30);
			b = a;
			a = T;
		}
		this.H[0] = (this.H[0] + a) | 0;
		this.H[1] = (this.H[1] + b) | 0;
		this.H[2] = (this.H[2] + c) | 0;
		this.H[3] = (this.H[3] + d) | 0;
		this.H[4] = (this.H[4] + e) | 0;
	}
}
