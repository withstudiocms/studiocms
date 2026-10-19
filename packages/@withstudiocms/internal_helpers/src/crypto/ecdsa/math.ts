export function euclideanMod(x: bigint, y: bigint): bigint {
	const r = x % y;
	if (r < 0n) {
		return r + y;
	}
	return r;
}

export function inverseMod(a: bigint, n: bigint): bigint {
	if (n < 0) {
		n = n * -1n;
	}
	if (a < 0) {
		a = euclideanMod(a, n);
	}
	let dividend = a;
	let divisor = n;
	let remainder = dividend % divisor;
	let quotient = dividend / divisor;
	let s1 = 1n;
	let s2 = 0n;
	let s3 = s1 - quotient * s2;
	while (remainder !== 0n) {
		dividend = divisor;
		divisor = remainder;
		s1 = s2;
		s2 = s3;
		remainder = dividend % divisor;
		quotient = dividend / divisor;
		s3 = s1 - quotient * s2;
	}
	if (divisor !== 1n) {
		throw new Error('a and n is not relatively prime');
	}
	if (s2 < 0) {
		return s2 + n;
	}
	return s2;
}

export function powmod(x: bigint, y: bigint, p: bigint): bigint {
	let res = 1n; // Initialize result
	x = x % p;
	while (y > 0) {
		if (y % 2n === 1n) {
			res = euclideanMod(res * x, p);
		}
		y = y >> 1n;
		x = euclideanMod(x * x, p);
	}
	return res;
}

// assumes p is prime
// https://en.wikipedia.org/wiki/Tonelli–Shanks_algorithm#The_algorithm
export function tonelliShanks(n: bigint, p: bigint): bigint {
	if (p % 4n === 3n) {
		return powmod(n, (p + 1n) / 4n, p);
	}

	if (powmod(n, (p - 1n) / 2n, p) === p - 1n) {
		throw new Error('Cannot find square root');
	}

	let q = p - 1n;
	let s = 0n;
	while (q % 2n === 0n) {
		q = q / 2n;
		s++;
	}

	let z = 2n;
	while (powmod(z, (p - 1n) / 2n, p) !== p - 1n) {
		z++;
	}

	let r = powmod(n, (q + 1n) / 2n, p);
	let t = powmod(n, q, p);
	let c = powmod(z, q, p);
	let m = s;

	// eslint-disable-next-line no-constant-condition
	while (true) {
		if (t === 1n) {
			return r;
		}
		let i = 1n;
		while (i <= m) {
			if (i === m) {
				throw new Error('Cannot find square root');
			}
			if (powmod(t, 2n ** i, p) === 1n) {
				break;
			}
			i++;
		}
		const b = c ** (2n ** (m - i - 1n));
		m = i;
		c = b ** 2n % p;
		t = (t * b ** 2n) % p;
		r = (r * b) % p;
	}
}
