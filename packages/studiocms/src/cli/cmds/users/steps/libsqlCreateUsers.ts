import { z } from 'astro/zod';
import color from 'chalk';
import dotenv from 'dotenv';
import checkIfUnsafe from '../../../../lib/auth/utils/unsafeCheck.js';
import type { Context } from '../../../lib/context.js';
import { tsPermissions, tsUsers, useLibSQLDb } from '../../../lib/useLibSQLDb.js';
import { StudioCMSColorwayError, StudioCMSColorwayInfo } from '../../../lib/utils.js';
import { checkRequiredEnvVars } from './utils/checkRequiredEnvVars.js';
import { hashPassword } from './utils/password.js';

dotenv.config();

export async function libsqlCreateUsers(ctx: Context) {
	ctx.debug && ctx.logger.debug('Running libsqlUsers...');

	ctx.debug && ctx.logger.debug('Checking for environment variables');

	const { ASTRO_DB_REMOTE_URL, ASTRO_DB_APP_TOKEN, CMS_ENCRYPTION_KEY } = process.env;

	checkRequiredEnvVars(ctx, ['ASTRO_DB_REMOTE_URL', 'ASTRO_DB_APP_TOKEN', 'CMS_ENCRYPTION_KEY']);

	// biome-ignore lint/style/noNonNullAssertion: <explanation>
	const db = useLibSQLDb(ASTRO_DB_REMOTE_URL!, ASTRO_DB_APP_TOKEN!);

	const currentUsers = await db.select().from(tsUsers);

	const inputData = await ctx.p.group(
		{
			username: () =>
				ctx.p.text({
					message: 'Username',
					placeholder: 'johndoe',
					validate: (user) => {
						const isUser = currentUsers.find(({ username }) => username === user);
						if (isUser) return 'Username is already in use, please try another one';
						if (checkIfUnsafe(username).username()) {
							return 'Username should not be a commonly used unsafe username (admin, root, etc.)';
						}
						return undefined;
					},
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
					validate: (email) => {
						const emailSchema = z.string().email({ message: 'Email address is invalid' });
						const response = emailSchema.safeParse(email);
						if (!response.success) return response.error.message;
						if (currentUsers.find((user) => user.email === email)) {
							return 'There is already a user with that email.';
						}
						return undefined;
					},
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

	if (ctx.dryRun) {
		ctx.tasks.push({
			title: `${StudioCMSColorwayInfo.bold('--dry-run')} ${color.dim('Skipping user creation')}`,
			task: async (message) => {
				message('Creating user... (skipped)');
			},
		});
	} else {
		ctx.tasks.push({
			title: color.dim('Creating user...'),
			task: async (message) => {
				try {
					const [insertedUser, insertedRank] = await db.batch([
						db.insert(tsUsers).values(newUser).returning(),
						db.insert(tsPermissions).values(newRank).returning(),
					]);

					if (insertedUser.length === 0 || insertedRank.length === 0) {
						message('There was an error inserting the user');
						ctx.exit(1);
					}

					message('User created Successfully');
				} catch (e) {
					if (e instanceof Error) {
						ctx.p.log.error(StudioCMSColorwayError(`Error: ${e.message}`));
						ctx.exit(1);
					} else {
						ctx.p.log.error(
							StudioCMSColorwayError('Unknown Error: Unable to create environment file.')
						);
						ctx.exit(1);
					}
				}
			},
		});
	}
}
