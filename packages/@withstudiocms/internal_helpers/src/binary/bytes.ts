export function compareBytes(a: Uint8Array, b: Uint8Array): boolean {
	if (a.byteLength !== b.byteLength) {
		return false;
	}
	for (let i = 0; i < b.byteLength; i++) {
		if (a[i] !== b[i]) {
			return false;
		}
	}
	return true;
}

export function concatenateBytes(a: Uint8Array, b: Uint8Array): Uint8Array {
	const result = new Uint8Array(a.byteLength + b.byteLength);
	result.set(a);
	result.set(b, a.byteLength);
	return result;
}

export class DynamicBuffer {
	private value: Uint8Array;
	public capacity: number;

	public length = 0;

	constructor(capacity: number) {
		this.value = new Uint8Array(capacity);
		this.capacity = capacity;
	}

	public write(bytes: Uint8Array): void {
		if (this.length + bytes.byteLength <= this.capacity) {
			this.value.set(bytes, this.length);
			this.length += bytes.byteLength;
			return;
		}
		while (this.length + bytes.byteLength > this.capacity) {
			if (this.capacity === 0) {
				this.capacity = 1;
			} else {
				this.capacity = this.capacity * 2;
			}
		}
		const newValue = new Uint8Array(this.capacity);
		newValue.set(this.value.subarray(0, this.length));
		newValue.set(bytes, this.length);
		this.value = newValue;
		this.length += bytes.byteLength;
	}

	public writeByte(byte: number): void {
		if (this.length + 1 <= this.capacity) {
			this.value[this.length] = byte;
			this.length++;
			return;
		}
		if (this.capacity === 0) {
			this.capacity = 1;
		} else {
			this.capacity = this.capacity * 2;
		}
		const newValue = new Uint8Array(this.capacity);
		newValue.set(this.value.subarray(0, this.length));
		newValue[this.length] = byte;
		this.value = newValue;
		this.length++;
	}

	public readInto(target: Uint8Array): void {
		if (target.byteLength < this.length) {
			throw new TypeError('Not enough space');
		}
		target.set(this.value.subarray(0, this.length));
	}

	public bytes(): Uint8Array {
		return this.value.slice(0, this.length);
	}

	public clear(): void {
		this.length = 0;
	}
}
