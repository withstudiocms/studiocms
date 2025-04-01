import { sha1 } from '@oslojs/crypto/sha1';
import { encodeHexLowerCase } from '@oslojs/encoding';
import dotenv from 'dotenv';
import { eq } from 'drizzle-orm';
import checkIfUnsafe from '../../../../lib/auth/utils/unsafeCheck.js';
import type { Context } from '../../../lib/context.js';
import { tsPermissions, tsUsers, useLibSQLDb } from '../../../lib/useLibSQLDb.js';
import { checkRequiredEnvVars } from './utils/checkRequiredEnvVars.js';
import { checkPassword, hashPassword } from './utils/password.js';

dotenv.config();

export async function libsqlModifyUsers(ctx: Context) {
	ctx.debug && ctx.logger.debug('Running libsqlUsers...');

	ctx.debug && ctx.logger.debug('Checking for environment variables');

	const { ASTRO_DB_REMOTE_URL, ASTRO_DB_APP_TOKEN, CMS_ENCRYPTION_KEY } = process.env;

	checkRequiredEnvVars(ctx, ['ASTRO_DB_REMOTE_URL', 'ASTRO_DB_APP_TOKEN', 'CMS_ENCRYPTION_KEY']);

	// biome-ignore lint/style/noNonNullAssertion: <explanation>
	const db = useLibSQLDb(ASTRO_DB_REMOTE_URL!, ASTRO_DB_APP_TOKEN!);

	ctx.debug && ctx.logger.debug('Getting Users from DB...');

	const allUsers: { value: string; label: string; hint?: string }[] = [];

	const [currentUsers, currentPermissions] = await db.batch([
		db.select().from(tsUsers),
		db.select().from(tsPermissions),
	]);

	if (currentUsers.length === 0) {
		ctx.p.note('There are no users in the database.', 'No Users Available');
		ctx.exit(0);
	}

	for (const user of currentUsers) {
		allUsers.push({
			value: user.id,
			label: user.username,
			hint: currentPermissions.find((userRank) => userRank.user === user.id)?.rank,
		});
	}

	const userSelection = await ctx.p.select({
		message: 'Which user would you like to update?',
		options: allUsers,
	});

	if (typeof userSelection === 'symbol') {
		ctx.pCancel(userSelection);
		ctx.exit(0);
	}

	ctx.p.note(`User ID Selected: ${userSelection}`);

	const action = await ctx.p.select({
		message: 'What user field you like to update?',
		options: [
			{ value: 'password', label: 'Password' },
			{ value: 'username', label: 'Username' },
			{ value: 'name', label: 'Display Name' },
		],
	});

	if (typeof action === 'symbol') {
		ctx.pCancel(action);
		ctx.exit(0);
	}

	switch (action) {
		case 'name': {
			const newDisplayName = await ctx.p.text({
				message: `Enter the user's new Display name`,
				placeholder: 'John Doe',
			});

			if (typeof newDisplayName === 'symbol') {
				ctx.pCancel(newDisplayName);
				ctx.exit(0);
			}

			const newData = await db
				.update(tsUsers)
				.set({ name: newDisplayName })
				.where(eq(tsUsers.id, userSelection))
				.returning()
				.get();

			if (newData.name === newDisplayName) {
				ctx.p.note('User Display Name updated successfully');
			} else {
				ctx.p.log.error('There was an Unknown error');
			}
			break;
		}
		case 'username': {
			const newUserName = await ctx.p.text({
				message: `Enter the user's new username`,
				placeholder: 'johndoe',
			});

			if (typeof newUserName === 'symbol') {
				ctx.pCancel(newUserName);
				ctx.exit(0);
			}

			const newData = await db
				.update(tsUsers)
				.set({ username: newUserName })
				.where(eq(tsUsers.id, userSelection))
				.returning()
				.get();

			if (newData.username === newUserName) {
				ctx.p.note('Username updated successfully');
			} else {
				ctx.p.log.error('There was an Unknown error');
			}
			break;
		}
		case 'password': {
			const newPassword = await ctx.p.password({
				message: `Enter the user's new password`,
				validate: (password) => {
					if (password.length < 6 || password.length > 255) {
						return 'Password must be between 6 and 255 characters';
					}

					// Check if password is known unsafe password
					if (checkIfUnsafe(password).password()) {
						return 'Password must not be a commonly known unsafe password (admin, root, etc.)';
					}

					return undefined;
				},
			});

			if (typeof newPassword === 'symbol') {
				ctx.pCancel(newPassword);
				ctx.exit(0);
			}

			// Check if password is in pwned password database
			const hash = encodeHexLowerCase(sha1(new TextEncoder().encode(newPassword)));
			const hashPrefix = hash.slice(0, 5);

			await checkPassword(hashPrefix, hash).catch((err) => ctx.p.log.error(err.message));

			// biome-ignore lint/style/noNonNullAssertion: <explanation>
			const hashedPassword = await hashPassword(newPassword, CMS_ENCRYPTION_KEY!);

			const newData = await db
				.update(tsUsers)
				.set({ password: hashedPassword })
				.where(eq(tsUsers.id, userSelection))
				.returning()
				.get();

			if (newData.password === hashedPassword) {
				ctx.p.note('User Password updated successfully');
			} else {
				ctx.p.log.error('There was an Unknown error');
			}
			break;
		}
	}
}
