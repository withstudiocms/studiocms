import {
	loadFixture as baseLoadFixture,
	type DevServer,
	type Fixture,
} from '@inox-tools/astro-tests/astroFixture';

type InlineConfig = Omit<Parameters<typeof baseLoadFixture>[0], 'root'> & {
	root: string;
};

export type { Fixture, DevServer };

export function loadFixture(inlineConfig: InlineConfig) {
	if (!inlineConfig?.root) throw new Error("Must provide { root: './fixtures/...' }");

	// resolve the relative root (i.e. "./fixtures/tailwindcss") to a full filepath
	// without this, the main `loadFixture` helper will resolve relative to `packages/astro/test`
	return baseLoadFixture({
		...inlineConfig,
		root: new URL(inlineConfig.root, import.meta.url).toString(),
	});
}

export function startOfHourISOString() {
	const date = new Date();
	date.setMinutes(0, 0, 0);
	return date.toISOString();
}

// biome-ignore lint/suspicious/noExplicitAny: This is fine
export class MockFunction<T extends Record<K, (...args: any[]) => void>, K extends keyof T> {
	calls: Parameters<T[K]>[] = [];
	object: T;
	property: K;
	original: T[K];

	constructor(object: T, property: K) {
		this.object = object;
		this.property = property;
		this.original = object[property];
		// @ts-ignore
		object[property] = (...args: Parameters<T[K]>) => {
			this.calls.push(args);
		};
	}
	restore() {
		this.object[this.property] = this.original;
	}
	reset() {
		this.calls = [];
	}
}
