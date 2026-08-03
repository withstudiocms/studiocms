import { bigIntBytes } from '../../binary/index.js';
import { euclideanMod, inverseMod } from './math.js';

export class ECDSAPoint {
	public x: bigint;
	public y: bigint;

	constructor(x: bigint, y: bigint) {
		this.x = x;
		this.y = y;
	}
}

class JacobianPoint {
	public x: bigint;
	public y: bigint;
	public z: bigint;

	constructor(x: bigint, y: bigint, z: bigint) {
		this.x = x;
		this.y = y;
		this.z = z;
	}

	public isAtInfinity(): boolean {
		return this.x === 0n && this.y === 1n && this.z === 0n;
	}
}

export class ECDSANamedCurve {
	public p: bigint;
	public a: bigint;
	public b: bigint;
	public g: ECDSAPoint;
	public n: bigint;
	public cofactor: bigint;

	public size: number;
	public objectIdentifier: string;

	constructor(
		p: bigint,
		a: bigint,
		b: bigint,
		gx: bigint,
		gy: bigint,
		n: bigint,
		cofactor: bigint,
		size: number,
		objectIdentifier: string
	) {
		this.p = p;
		this.a = a;
		this.b = b;
		this.g = new ECDSAPoint(gx, gy);
		this.n = n;
		this.cofactor = cofactor;

		this.size = size;
		this.objectIdentifier = objectIdentifier;
	}

	public add(point1: ECDSAPoint, point2: ECDSAPoint): ECDSAPoint | null {
		const jacobian1 = this.fromAffine(point1);
		const jacobian2 = this.fromAffine(point2);
		return this.toAffine(this.addJacobian(jacobian1, jacobian2));
	}

	private addJacobian(point1: JacobianPoint, point2: JacobianPoint): JacobianPoint {
		if (point1.isAtInfinity()) {
			return point2;
		}
		if (point2.isAtInfinity()) {
			return point1;
		}
		const point1zz = point1.z ** 2n;
		const point2zz = point2.z ** 2n;
		const u1 = euclideanMod(point1.x * point2zz, this.p);
		const u2 = euclideanMod(point2.x * point1zz, this.p);
		const s1 = euclideanMod(point1.y * point2zz * point2.z, this.p);
		const s2 = euclideanMod(point2.y * point1zz * point1.z, this.p);
		if (u1 === u2) {
			if (s1 !== s2) {
				return pointAtInfinity();
			}
			return this.doubleJacobian(point1);
		}
		const h = u2 - u1;
		const r = s2 - s1;
		const point3x = euclideanMod(r ** 2n - h ** 3n - 2n * u1 * h ** 2n, this.p);
		const point3 = new JacobianPoint(
			point3x,
			euclideanMod(r * (u1 * h ** 2n - point3x) - s1 * h ** 3n, this.p),
			euclideanMod(h * point1.z * point2.z, this.p)
		);
		return point3;
	}

	public double(point: ECDSAPoint): ECDSAPoint | null {
		const jacobian = this.fromAffine(point);
		return this.toAffine(this.doubleJacobian(jacobian));
	}

	private doubleJacobian(point: JacobianPoint): JacobianPoint {
		if (point.isAtInfinity()) {
			return point;
		}
		if (point.y === 0n) {
			return pointAtInfinity();
		}
		const s = euclideanMod(4n * point.x * point.y ** 2n, this.p);
		const m = euclideanMod(3n * point.x ** 2n + this.a * point.z ** 4n, this.p);
		const resultx = euclideanMod(m ** 2n - 2n * s, this.p);
		const result = new JacobianPoint(
			resultx,
			euclideanMod(m * (s - resultx) - 8n * point.y ** 4n, this.p),
			euclideanMod(2n * point.y * point.z, this.p)
		);
		return result;
	}

	public toAffine(point: JacobianPoint): ECDSAPoint | null {
		if (point.isAtInfinity()) {
			return null;
		}
		const inverseZ = inverseMod(point.z, this.p);
		const inverseZ2 = inverseZ ** 2n;
		const affine = new ECDSAPoint(
			euclideanMod(point.x * inverseZ2, this.p),
			euclideanMod(point.y * inverseZ2 * inverseZ, this.p)
		);
		return affine;
	}

	public fromAffine(point: ECDSAPoint): JacobianPoint {
		return new JacobianPoint(point.x, point.y, 1n);
	}

	// Assumes the point is already on the curve
	public multiply(k: bigint, point: ECDSAPoint): ECDSAPoint | null {
		const kBytes = bigIntBytes(k);
		const bitLength = k.toString(2).length;
		let res = pointAtInfinity();
		let temp = new JacobianPoint(point.x, point.y, 1n);
		for (let i = 0; i < bitLength; i++) {
			const byte = kBytes[kBytes.byteLength - 1 - Math.floor(i / 8)];
			if ((byte >> (i % 8)) & 0x01) {
				res = this.addJacobian(res, temp);
			}
			temp = this.doubleJacobian(temp);
		}
		return this.toAffine(res);
	}

	public isOnCurve(point: ECDSAPoint): boolean {
		// For co-factor h > 1, ensure the point is in the prime order subgroup
		if (this.cofactor !== 1n && this.multiply(this.n, point) !== null) {
			return false;
		}
		return (
			euclideanMod(point.y ** 2n, this.p) ===
			euclideanMod(point.x ** 3n + this.a * point.x + this.b, this.p)
		);
	}
}

function pointAtInfinity(): JacobianPoint {
	return new JacobianPoint(0n, 1n, 0n);
}
