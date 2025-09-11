import { runEffect } from '@withstudiocms/effect';
import { describe, expect, it } from 'vitest';
import { UserPermissionLevel } from '../../src/types.js';
import {
	getDefaultUserSession,
	getLevel,
	parseRequiredPerms,
	verifyUsernameCharacters,
	verifyUsernameLength,
	verifyUsernameSafe,
} from '../../src/utils/user.js';

describe('User Utils', () => {
	it('verifyUsernameLength returns error for too short username', async () => {
		const result = await runEffect(verifyUsernameLength('ab'));
		expect(result).toBe('Username must be between 3 and 32 characters long');
	});

	it('verifyUsernameLength returns error for too long username', async () => {
		const result = await runEffect(verifyUsernameLength('a'.repeat(33)));
		expect(result).toBe('Username must be between 3 and 32 characters long');
	});

	it('verifyUsernameLength returns undefined for valid username', async () => {
		const result = await runEffect(verifyUsernameLength('validuser'));
		expect(result).toBeUndefined();
	});

	it('verifyUsernameCharacters returns error for invalid characters', async () => {
		const result = await runEffect(verifyUsernameCharacters('Invalid!User'));
		expect(result).toBe(
			'Username can only contain lowercase letters, numbers, hyphens (-), and underscores (_)'
		);
	});

	it('verifyUsernameCharacters returns undefined for valid username', async () => {
		const result = await runEffect(verifyUsernameCharacters('valid_user-123'));
		expect(result).toBeUndefined();
	});

	it('verifyUsernameSafe returns error for unsafe username', async () => {
		const result = await runEffect(verifyUsernameSafe('admin'));
		expect(result).toBe(
			'Username should not be a commonly used unsafe username (admin, root, etc.)'
		);
	});

	it('verifyUsernameSafe returns undefined for safe username', async () => {
		const result = await runEffect(verifyUsernameSafe('uniquename123'));
		expect(result).toBeUndefined();
	});

	it('getDefaultUserSession returns correct default session', async () => {
		const session = await runEffect(getDefaultUserSession());
		expect(session).toStrictEqual({
			isLoggedIn: false,
			user: null,
			permissionLevel: 'unknown',
		});
	});

	it('getLevel returns unknown for null', async () => {
		const result = await runEffect(getLevel(null));
		expect(result).toBe('unknown');
	});

	it('getLevel returns permissionLevel from UserSessionData', async () => {
		const userData = { isLoggedIn: true, user: null, permissionLevel: 'admin' as const };
		const result = await runEffect(getLevel(userData));
		expect(result).toBe('admin');
	});

	it('getLevel returns permissionsData.rank from CombinedUserData', async () => {
		const userData = {
			isLoggedIn: true,
			user: null,
			permissionLevel: 'visitor' as const,
			permissionsData: { rank: 'editor' as const },
		};
		const result = await runEffect(getLevel(userData));
		expect(result).toBe('editor');
	});

	it('parseRequiredPerms returns correct UserPermissionLevel', async () => {
		expect(await runEffect(parseRequiredPerms('owner'))).toBe(UserPermissionLevel.owner);
		expect(await runEffect(parseRequiredPerms('admin'))).toBe(UserPermissionLevel.admin);
		expect(await runEffect(parseRequiredPerms('editor'))).toBe(UserPermissionLevel.editor);
		expect(await runEffect(parseRequiredPerms('visitor'))).toBe(UserPermissionLevel.visitor);
		expect(await runEffect(parseRequiredPerms('unknown'))).toBe(UserPermissionLevel.unknown);
	});
});
