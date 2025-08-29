import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { runEffect } from '@withstudiocms/effect';
import { UserPermissionLevel } from '../../dist/types.js';
import {
	getDefaultUserSession,
	getLevel,
	parseRequiredPerms,
	verifyUsernameCharacters,
	verifyUsernameLength,
	verifyUsernameSafe,
} from '../../dist/utils/user.js';

describe('User Utils', () => {
	test('verifyUsernameLength returns error for too short username', async () => {
		const result = await runEffect(verifyUsernameLength('ab'));
		assert.equal(result, 'Username must be between 3 and 32 characters long');
	});

	test('verifyUsernameLength returns error for too long username', async () => {
		const result = await runEffect(verifyUsernameLength('a'.repeat(33)));
		assert.equal(result, 'Username must be between 3 and 32 characters long');
	});

	test('verifyUsernameLength returns undefined for valid username', async () => {
		const result = await runEffect(verifyUsernameLength('validuser'));
		assert.equal(result, undefined);
	});

	test('verifyUsernameCharacters returns error for invalid characters', async () => {
		const result = await runEffect(verifyUsernameCharacters('Invalid!User'));
		assert.equal(
			result,
			'Username can only contain lowercase letters, numbers, hyphens (-), and underscores (_)'
		);
	});

	test('verifyUsernameCharacters returns undefined for valid username', async () => {
		const result = await runEffect(verifyUsernameCharacters('valid_user-123'));
		assert.equal(result, undefined);
	});

	test('verifyUsernameSafe returns error for unsafe username', async () => {
		// 'admin' is commonly unsafe, adjust if your list differs
		const result = await runEffect(verifyUsernameSafe('admin'));
		assert.equal(
			result,
			'Username should not be a commonly used unsafe username (admin, root, etc.)'
		);
	});

	test('verifyUsernameSafe returns undefined for safe username', async () => {
		const result = await runEffect(verifyUsernameSafe('uniquename123'));
		assert.equal(result, undefined);
	});

	test('getDefaultUserSession returns correct default session', async () => {
		const session = await runEffect(getDefaultUserSession());
		assert.deepEqual(session, {
			isLoggedIn: false,
			user: null,
			permissionLevel: 'unknown',
		});
	});

	test('getLevel returns unknown for null', async () => {
		const result = await runEffect(getLevel(null));
		assert.equal(result, 'unknown');
	});

	test('getLevel returns permissionLevel from UserSessionData', async () => {
		const userData = { isLoggedIn: true, user: null, permissionLevel: 'admin' };
		const result = await runEffect(getLevel(userData));
		assert.equal(result, 'admin');
	});

	test('getLevel returns permissionsData.rank from CombinedUserData', async () => {
		const userData = {
			isLoggedIn: true,
			user: null,
			permissionLevel: 'visitor',
			permissionsData: { rank: 'editor' },
		};
		const result = await runEffect(getLevel(userData));
		assert.equal(result, 'editor');
	});

	test('parseRequiredPerms returns correct UserPermissionLevel', async () => {
		assert.equal(await runEffect(parseRequiredPerms('owner')), UserPermissionLevel.owner);
		assert.equal(await runEffect(parseRequiredPerms('admin')), UserPermissionLevel.admin);
		assert.equal(await runEffect(parseRequiredPerms('editor')), UserPermissionLevel.editor);
		assert.equal(await runEffect(parseRequiredPerms('visitor')), UserPermissionLevel.visitor);
		assert.equal(await runEffect(parseRequiredPerms('unknown')), UserPermissionLevel.unknown);
	});
});
