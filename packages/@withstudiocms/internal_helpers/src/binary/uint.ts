class BigEndian implements ByteOrder {
	public uint8(data: Uint8Array, offset: number): number {
		if (data.byteLength < offset + 1) {
			throw new TypeError('Insufficient bytes');
		}
		return data[offset];
	}

	public uint16(data: Uint8Array, offset: number): number {
		if (data.byteLength < offset + 2) {
			throw new TypeError('Insufficient bytes');
		}
		return (data[offset] << 8) | data[offset + 1];
	}

	public uint32(data: Uint8Array, offset: number): number {
		if (data.byteLength < offset + 4) {
			throw new TypeError('Insufficient bytes');
		}
		let result = 0;
		for (let i = 0; i < 4; i++) {
			result |= data[offset + i] << (24 - i * 8);
		}
		return result;
	}

	public uint64(data: Uint8Array, offset: number): bigint {
		if (data.byteLength < offset + 8) {
			throw new TypeError('Insufficient bytes');
		}
		let result = 0n;
		for (let i = 0; i < 8; i++) {
			result |= BigInt(data[offset + i]) << BigInt(56 - i * 8);
		}
		return result;
	}

	public putUint8(target: Uint8Array, value: number, offset: number): void {
		if (target.length < offset + 1) {
			throw new TypeError('Not enough space');
		}
		if (value < 0 || value > 255) {
			throw new TypeError('Invalid uint8 value');
		}
		target[offset] = value;
	}

	public putUint16(target: Uint8Array, value: number, offset: number): void {
		if (target.length < offset + 2) {
			throw new TypeError('Not enough space');
		}
		if (value < 0 || value > 65535) {
			throw new TypeError('Invalid uint16 value');
		}
		target[offset] = value >> 8;
		target[offset + 1] = value & 0xff;
	}

	public putUint32(target: Uint8Array, value: number, offset: number): void {
		if (target.length < offset + 4) {
			throw new TypeError('Not enough space');
		}
		if (value < 0 || value > 4294967295) {
			throw new TypeError('Invalid uint32 value');
		}
		for (let i = 0; i < 4; i++) {
			target[offset + i] = (value >> ((3 - i) * 8)) & 0xff;
		}
	}

	public putUint64(target: Uint8Array, value: bigint, offset: number): void {
		if (target.length < offset + 8) {
			throw new TypeError('Not enough space');
		}
		if (value < 0 || value > 18446744073709551615n) {
			throw new TypeError('Invalid uint64 value');
		}
		for (let i = 0; i < 8; i++) {
			target[offset + i] = Number((value >> BigInt((7 - i) * 8)) & 0xffn);
		}
	}
}

class LittleEndian implements ByteOrder {
	public uint8(data: Uint8Array, offset: number): number {
		if (data.byteLength < offset + 1) {
			throw new TypeError('Insufficient bytes');
		}
		return data[offset];
	}

	public uint16(data: Uint8Array, offset: number): number {
		if (data.byteLength < offset + 2) {
			throw new TypeError('Insufficient bytes');
		}
		return data[offset] | (data[offset + 1] << 8);
	}

	public uint32(data: Uint8Array, offset: number): number {
		if (data.byteLength < offset + 4) {
			throw new TypeError('Insufficient bytes');
		}
		let result = 0;
		for (let i = 0; i < 4; i++) {
			result |= data[offset + i] << (i * 8);
		}
		return result;
	}

	public uint64(data: Uint8Array, offset: number): bigint {
		if (data.byteLength < offset + 8) {
			throw new TypeError('Insufficient bytes');
		}
		let result = 0n;
		for (let i = 0; i < 8; i++) {
			result |= BigInt(data[offset + i]) << BigInt(i * 8);
		}
		return result;
	}

	public putUint8(target: Uint8Array, value: number, offset: number): void {
		if (target.length < 1 + offset) {
			throw new TypeError('Insufficient space');
		}
		if (value < 0 || value > 255) {
			throw new TypeError('Invalid uint8 value');
		}
		target[offset] = value;
	}

	public putUint16(target: Uint8Array, value: number, offset: number): void {
		if (target.length < 2 + offset) {
			throw new TypeError('Insufficient space');
		}
		if (value < 0 || value > 65535) {
			throw new TypeError('Invalid uint16 value');
		}
		target[offset + 1] = value >> 8;
		target[offset] = value & 0xff;
	}

	public putUint32(target: Uint8Array, value: number, offset: number): void {
		if (target.length < 4 + offset) {
			throw new TypeError('Insufficient space');
		}
		if (value < 0 || value > 4294967295) {
			throw new TypeError('Invalid uint32 value');
		}
		for (let i = 0; i < 4; i++) {
			target[offset + i] = (value >> (i * 8)) & 0xff;
		}
	}

	public putUint64(target: Uint8Array, value: bigint, offset: number): void {
		if (target.length < 8 + offset) {
			throw new TypeError('Insufficient space');
		}
		if (value < 0 || value > 18446744073709551615n) {
			throw new TypeError('Invalid uint64 value');
		}
		for (let i = 0; i < 8; i++) {
			target[offset + i] = Number((value >> BigInt(i * 8)) & 0xffn);
		}
	}
}

export const bigEndian = new BigEndian();

export const littleEndian = new LittleEndian();

export interface ByteOrder {
	uint8(data: Uint8Array, offset: number): number;
	uint16(data: Uint8Array, offset: number): number;
	uint32(data: Uint8Array, offset: number): number;
	uint64(data: Uint8Array, offset: number): bigint;
	putUint8(target: Uint8Array, value: number, offset: number): void;
	putUint16(target: Uint8Array, value: number, offset: number): void;
	putUint32(target: Uint8Array, value: number, offset: number): void;
	putUint64(target: Uint8Array, value: bigint, offset: number): void;
}
