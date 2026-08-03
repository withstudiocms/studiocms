export function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
	if (a.length !== b.length) {
		return false;
	}
	let c = 0;
	for (let i = 0; i < a.length; i++) {
		// biome-ignore lint/style/noNonNullAssertion: this is fine
		c |= a[i]! ^ b[i]!;
	}
	return c === 0;
}
