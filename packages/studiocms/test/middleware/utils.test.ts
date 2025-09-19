/** biome-ignore-all lint/suspicious/noExplicitAny: allowed in tests */
import { UserPermissionLevel } from '@withstudiocms/auth-kit/types';
import type { APIContext } from 'astro';
import { Effect } from 'effect';
import { describe, expect, it } from 'vitest';
import {
	getUserPermissionLevel,
	getUserPermissions,
	makeFallbackSiteConfig,
	SetLocal,
	setLocals,
} from '../../src/middleware/utils';

describe('getUserPermissionLevel', () => {
	it('returns correct permission level for each user type', async () => {
		const cases = [
			{ permissionLevel: 'owner', expected: UserPermissionLevel.owner },
			{ permissionLevel: 'admin', expected: UserPermissionLevel.admin },
			{ permissionLevel: 'editor', expected: UserPermissionLevel.editor },
			{ permissionLevel: 'visitor', expected: UserPermissionLevel.visitor },
			{ permissionLevel: 'unknown', expected: UserPermissionLevel.unknown },
			{ permissionLevel: 'other', expected: UserPermissionLevel.unknown },
		];
		for (const { permissionLevel, expected } of cases) {
			const userData = { permissionLevel } as any;
			const result = await Effect.runPromise(getUserPermissionLevel(userData));
			expect(result).toBe(expected);
		}
	});
});

describe('getUserPermissions', () => {
	it('returns correct permission flags for each level', async () => {
		const levels: [
			'owner' | 'admin' | 'editor' | 'visitor' | 'unknown',
			Record<string, boolean>,
		][] = [
			['owner', { isOwner: true, isAdmin: true, isEditor: true, isVisitor: true }],
			['admin', { isOwner: false, isAdmin: true, isEditor: true, isVisitor: true }],
			['editor', { isOwner: false, isAdmin: false, isEditor: true, isVisitor: true }],
			['visitor', { isOwner: false, isAdmin: false, isEditor: false, isVisitor: true }],
			['unknown', { isOwner: false, isAdmin: false, isEditor: false, isVisitor: false }],
		];
		for (const [permissionLevel, expected] of levels) {
			const userData = { permissionLevel } as any;
			const result = await Effect.runPromise(getUserPermissions(userData));

			console.log({ result, expected, permissionLevel });

			expect(result).toMatchObject(expected);
		}
	});
});

describe('makeFallbackSiteConfig', () => {
	it('returns a valid fallback site config object', () => {
		const config = makeFallbackSiteConfig();
		expect(config).toHaveProperty('lastCacheUpdate');
		expect(config.data).toMatchObject({
			defaultOgImage: null,
			description: 'A StudioCMS Project',
			diffPerPage: 10,
			enableDiffs: false,
			enableMailer: false,
			gridItems: [],
			hideDefaultIndex: false,
			loginPageBackground: 'studiocms-curves',
			loginPageCustomImage: null,
			siteIcon: null,
			title: 'StudioCMS-Setup',
		});
		expect(typeof config.data._config_version).toBe('string');
	});
});

describe('setLocals', () => {
	function makeContext(initial: any = {}) {
		return {
			locals: {
				StudioCMS: initial,
			},
		} as unknown as APIContext;
	}

	it('merges general values without overwriting security/plugins', async () => {
		const context = makeContext({
			foo: 1,
			security: { token: 'abc' },
			plugins: { bar: true },
		});
		// @ts-expect-error - doing this to test runtime behavior
		await Effect.runPromise(setLocals(context, SetLocal.GENERAL, { foo: 2, baz: 3 }));
		expect(context.locals.StudioCMS).toMatchObject({
			foo: 2,
			baz: 3,
			security: { token: 'abc' },
			plugins: { bar: true },
		});
	});

	it('merges security values without overwriting general/plugins', async () => {
		const context = makeContext({
			foo: 1,
			security: { token: 'abc' },
			plugins: { bar: true },
		});
		// @ts-expect-error - doing this to test runtime behavior
		await Effect.runPromise(setLocals(context, SetLocal.SECURITY, { token: 'xyz', extra: 42 }));
		expect(context.locals.StudioCMS.security).toMatchObject({ token: 'xyz', extra: 42 });
		expect(context.locals.StudioCMS.plugins).toMatchObject({ bar: true });
		// @ts-expect-error - doing this to test runtime behavior
		expect(context.locals.StudioCMS.foo).toBe(1);
	});

	it('merges plugin values without overwriting general/security', async () => {
		const context = makeContext({
			foo: 1,
			security: { token: 'abc' },
			plugins: { bar: true },
		});
		// @ts-expect-error - doing this to test runtime behavior
		await Effect.runPromise(setLocals(context, SetLocal.PLUGINS, { bar: false, baz: true }));
		expect(context.locals.StudioCMS.plugins).toMatchObject({ bar: false, baz: true });
		expect(context.locals.StudioCMS.security).toMatchObject({ token: 'abc' });
		// @ts-expect-error - doing this to test runtime behavior
		expect(context.locals.StudioCMS.foo).toBe(1);
	});

	it('returns error for unknown key', async () => {
		const context = makeContext({});
		await expect(Effect.runPromise(setLocals(context, 'notakey' as any, {}))).rejects.toThrow(
			'Unknown key: notakey'
		);
	});
});
