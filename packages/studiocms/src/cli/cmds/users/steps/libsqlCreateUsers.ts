import { sha1 } from '@oslojs/crypto/sha1';
import { encodeHexLowerCase } from '@oslojs/encoding';
import dotenv from 'dotenv';
import checkIfUnsafe from '../../../../lib/auth/utils/unsafeCheck.js';
import type { Context } from '../../../lib/context.js';
import { tables, useLibSQLDb } from '../../../lib/useLibSQLDb.js';
import { checkPassword, hashPassword } from './utils/password.js';

dotenv.config();

const { tsUsers, tsPermissions } = tables;

function checkRequiredEnvVars(ctx: Context, envVars: string[]) {
	for (const varName of envVars) {
		if (!process.env[varName]) {
			ctx.logger.error(`${varName} is a required environment variable when using this utility.`);
			ctx.exit(1);
		}
	}
}

export async function libsqlCreateUsers(ctx: Context) {
	ctx.debug && ctx.logger.debug('Running libsqlUsers...');

	ctx.debug && ctx.logger.debug('Checking for environment variables');

	const { ASTRO_DB_REMOTE_URL, ASTRO_DB_APP_TOKEN, CMS_ENCRYPTION_KEY } = process.env;

	checkRequiredEnvVars(ctx, ['ASTRO_DB_REMOTE_URL', 'ASTRO_DB_APP_TOKEN', 'CMS_ENCRYPTION_KEY']);

	// biome-ignore lint/style/noNonNullAssertion: <explanation>
	const db = useLibSQLDb(ASTRO_DB_REMOTE_URL!, ASTRO_DB_APP_TOKEN!);

	const inputData = await ctx.p.group(
		{
			username: () =>
				ctx.p.text({
					message: 'Username',
					placeholder: 'johndoe',
				}),
			name: () =>
				ctx.p.text({
					message: 'Display Name',
					placeholder: 'John Doe',
				}),
			email: () =>
				ctx.p.text({
					message: 'E-Mail Address',
					placeholder: 'john@doe.tld',
				}),
			newPassword: () =>
				ctx.p.password({
					message: 'Password',
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
				}),
			confirmPassword: () =>
				ctx.p.password({
					message: 'Confirm Password',
				}),
			rank: () =>
				ctx.p.select({
					message: 'What Role should this user have?',
					options: [
						{ value: 'visitor', label: 'Visitor' },
						{ value: 'editor', label: 'Editor' },
						{ value: 'admin', label: 'Admin' },
						{ value: 'owner', label: 'Owner' },
					],
				}),
		},
		{
			onCancel: () => ctx.pOnCancel(),
		}
	);

	const { confirmPassword, email, name, newPassword, rank, username } = inputData;

	if (newPassword !== confirmPassword) {
		ctx.p.log.error('Passwords do not match!');
		ctx.exit(1);
	}

	// Check if password is in pwned password database
	const hash = encodeHexLowerCase(sha1(new TextEncoder().encode(newPassword)));
	const hashPrefix = hash.slice(0, 5);

	await checkPassword(hashPrefix, hash).catch((err) => ctx.p.log.error(err.message));

	// biome-ignore lint/style/noNonNullAssertion: <explanation>
	const password = await hashPassword(newPassword, CMS_ENCRYPTION_KEY!);

	const newUserId = crypto.randomUUID();

	const newUser: typeof tsUsers.$inferInsert = {
		id: newUserId,
		name,
		username,
		email,
		password,
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	const newRank: typeof tsPermissions.$inferInsert = {
		user: newUserId,
		rank,
	};

	const currentUsers = await db.select().from(tsUsers);

	if (currentUsers.find((user) => user.username === username)) {
		ctx.logger.error('There is already a user with that username.');
		ctx.exit(1);
	}
	if (currentUsers.find((user) => user.email === email)) {
		ctx.logger.error('There is already a user with that email.');
		ctx.exit(1);
	}

	const [insertedUser, insertedRank] = await db.batch([
		db.insert(tsUsers).values(newUser).returning(),
		db.insert(tsPermissions).values(newRank).returning(),
	]);

	if (insertedUser.length === 0 || insertedRank.length === 0) {
		ctx.logger.error('There was an error inserting the user');
		ctx.exit(1);
	}

	ctx.p.note('User created Successfully', 'Success');
}
