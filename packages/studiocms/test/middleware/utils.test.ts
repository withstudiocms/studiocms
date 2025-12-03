/** biome-ignore-all lint/suspicious/noExplicitAny: allowed in tests */

import { UserPermissionLevel } from '@withstudiocms/auth-kit/types';
import type { APIContext } from 'astro';
import { Effect } from 'effect';
import { describe, expect } from 'vitest';
import {
	getUserPermissionLevel,
	getUserPermissions,
	makeFallbackSiteConfig,
	SetLocal,
	setLocals,
} from '#frontend/middleware/utils.js';
import { allureTester } from '../fixtures/allureTester';
import { parentSuiteName, sharedTags } from '../test-utils';

const localSuiteName = 'Middleware Utils tests';

function makeContext(initial: any = {}) {
	return {
		locals: {
			StudioCMS: initial,
		},
	} as unknown as APIContext;
}

describe(parentSuiteName, () => {
	const test = allureTester({
		suiteName: localSuiteName,
		suiteParentName: parentSuiteName,
	});

	[
		{ permissionLevel: 'owner' as const, expected: UserPermissionLevel.owner },
		{ permissionLevel: 'admin' as const, expected: UserPermissionLevel.admin },
		{ permissionLevel: 'editor' as const, expected: UserPermissionLevel.editor },
		{ permissionLevel: 'visitor' as const, expected: UserPermissionLevel.visitor },
		{ permissionLevel: 'unknown' as const, expected: UserPermissionLevel.unknown },
	].forEach(({ permissionLevel, expected }, index) => {
		const testName = `getUserPermissionLevel test case #${index + 1}`;
		const tags = [...sharedTags, 'middleware:utils', 'middleware:getUserPermissionLevel'];

		test(testName, async ({ setupAllure }) => {
			await setupAllure({
				subSuiteName: 'getUserPermissionLevel tests',
				tags: [...tags],
				parameters: {
					data: JSON.stringify({ permissionLevel }),
				},
			});

			const userData = { permissionLevel } as any;
			const result = await Effect.runPromise(getUserPermissionLevel(userData));
			expect(result).toBe(expected);
		});
	});

	(
		[
			['owner', { isOwner: true, isAdmin: true, isEditor: true, isVisitor: true }],
			['admin', { isOwner: false, isAdmin: true, isEditor: true, isVisitor: true }],
			['editor', { isOwner: false, isAdmin: false, isEditor: true, isVisitor: true }],
			['visitor', { isOwner: false, isAdmin: false, isEditor: false, isVisitor: true }],
			['unknown', { isOwner: false, isAdmin: false, isEditor: false, isVisitor: false }],
		] as ['owner' | 'admin' | 'editor' | 'visitor' | 'unknown', Record<string, boolean>][]
	).forEach(([permissionLevel, expected], index) => {
		const testName = `getUserPermissions test case #${index + 1}`;
		const tags = [...sharedTags, 'middleware:utils', 'middleware:getUserPermissions'];

		test(testName, async ({ setupAllure }) => {
			await setupAllure({
				subSuiteName: 'getUserPermissions tests',
				tags: [...tags],
				parameters: {
					data: JSON.stringify({ permissionLevel }),
				},
			});

			const userData = { permissionLevel } as any;
			const result = await Effect.runPromise(getUserPermissions(userData));
			expect(result).toMatchObject(expected);
		});
	});

	test('makeFallbackSiteConfig returns valid config', async ({ setupAllure, step }) => {
		await setupAllure({
			subSuiteName: 'makeFallbackSiteConfig tests',
			tags: [...sharedTags, 'middleware:utils', 'middleware:makeFallbackSiteConfig'],
		});

		await step('Generate fallback site config', () => {
			const config = makeFallbackSiteConfig();
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

	test('setLocals - merges general values without overwriting security/plugins', async ({
		setupAllure,
	}) => {
		await setupAllure({
			subSuiteName: 'setLocals tests - GENERAL',
			tags: [...sharedTags, 'middleware:utils', 'middleware:setLocals'],
		});

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

	test('setLocals - merges security values without overwriting general/plugins', async ({
		setupAllure,
	}) => {
		await setupAllure({
			subSuiteName: 'setLocals tests - SECURITY',
			tags: [...sharedTags, 'middleware:utils', 'middleware:setLocals'],
		});

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

	test('setLocals - merges plugins values without overwriting general/security', async ({
		setupAllure,
	}) => {
		await setupAllure({
			subSuiteName: 'setLocals tests - PLUGINS',
			tags: [...sharedTags, 'middleware:utils', 'middleware:setLocals'],
		});

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

	test('setLocals - throws error for unknown key', async ({ setupAllure }) => {
		await setupAllure({
			subSuiteName: 'setLocals tests - UNKNOWN KEY',
			tags: [...sharedTags, 'middleware:utils', 'middleware:setLocals'],
		});

		const context = makeContext({});
		await expect(Effect.runPromise(setLocals(context, 'notakey' as any, {}))).rejects.toThrow(
			'Unknown key: notakey'
		);
	});
});
