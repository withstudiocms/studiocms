import { sha1 } from '@oslojs/crypto/sha1';
import { encodeHexLowerCase } from '@oslojs/encoding';
import dotenv from 'dotenv';
import { eq } from 'drizzle-orm';
import checkIfUnsafe from '../../../../lib/auth/utils/unsafeCheck.js';
import type { Context } from '../../../lib/context.js';
import { tables, useLibSQLDb } from '../../../lib/useLibSQLDb.js';
import { checkPassword, hashPassword } from './utils/password.js';

dotenv.config();

const { tsUsers, tsPermissions } = tables;

export async function libsqlCreateUsers(ctx: Context) {
	ctx.debug && ctx.logger.debug('Running libsqlUsers...');

	ctx.debug && ctx.logger.debug('Checking for environment variables');

	const { ASTRO_DB_REMOTE_URL, ASTRO_DB_APP_TOKEN, CMS_ENCRYPTION_KEY } = process.env;

	if (!ASTRO_DB_REMOTE_URL) {
		ctx.logger.error(
			'ASTRO_DB_REMOTE_URL is a required environment variable when using this utility.'
		);
		ctx.exit(1);
	}

	if (!ASTRO_DB_APP_TOKEN) {
		ctx.logger.error(
			'ASTRO_DB_APP_TOKEN is a required environment variable when using this utility.'
		);
		ctx.exit(1);
	}

	if (!CMS_ENCRYPTION_KEY) {
		ctx.logger.error(
			'CMS_ENCRYPTION_KEY is a required environment variable when using this utility.'
		);
		ctx.exit(1);
	}

	const db = useLibSQLDb(ASTRO_DB_REMOTE_URL, ASTRO_DB_APP_TOKEN);

	const username = await ctx.p.text({
		message: 'Username',
		placeholder: 'johndoe',
	});

	if (typeof username === 'symbol') {
		ctx.pCancel(username);
		ctx.exit(0);
	}

	const name = await ctx.p.text({
		message: 'Display Name',
		placeholder: 'John Doe',
	});

	if (typeof name === 'symbol') {
		ctx.pCancel(name);
		ctx.exit(0);
	}

	const email = await ctx.p.text({
		message: 'E-Mail Address',
		placeholder: 'john@doe.tld',
	});

	if (typeof email === 'symbol') {
		ctx.pCancel(email);
		ctx.exit(0);
	}

	const newPassword = await ctx.p.password({
		message: 'Password',
		validate: (password) => {
			if (password.length < 6 || password.length > 255) {
				return 'Password must be between 6 and 255 characters';
			}

			// Check if password is known unsafe password
			if (checkIfUnsafe(password).password()) {
				return 'Password must not be a commonly known unsafe password (admin, root, etc.)';
			}

			// Check if password is in pwned password database
			const hash = encodeHexLowerCase(sha1(new TextEncoder().encode(password)));
			const hashPrefix = hash.slice(0, 5);

			checkPassword(hashPrefix, hash).catch((err) => ctx.p.log.error(err.message));

			return undefined;
		},
	});

	if (typeof newPassword === 'symbol') {
		ctx.pCancel(newPassword);
		ctx.exit(0);
	}

	const confirmPassword = await ctx.p.password({
		message: 'Confirm Password',
		validate: (confirmPass) => {
			if (confirmPass !== newPassword) return 'Passwords do not match';
			return undefined;
		},
	});

	if (typeof confirmPassword === 'symbol') {
		ctx.pCancel(confirmPassword);
		ctx.exit(0);
	}

	const password = await hashPassword(newPassword, CMS_ENCRYPTION_KEY);

	const rank = await ctx.p.select({
		message: 'What Role should this user have?',
		options: [
			{ value: 'visitor', label: 'Visitor' },
			{ value: 'editor', label: 'Editor' },
			{ value: 'admin', label: 'Admin' },
			{ value: 'owner', label: 'Owner' },
		],
	});

	if (typeof rank === 'symbol') {
		ctx.pCancel(rank);
		ctx.exit(0);
	}

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
	}
	if (currentUsers.find((user) => user.email === email)) {
		ctx.logger.error('There is already a user with that email.');
	}

	const [insertedUser, insertedRank] = await db.batch([
		db.insert(tsUsers).values(newUser).returning(),
		db.insert(tsPermissions).values(newRank).returning(),
	]);

	if (insertedUser.length === 0 || insertedRank.length === 0) {
		ctx.logger.error('There was an error inserting the user');
	}

	ctx.p.note('User created Successfully', 'Success');
}
