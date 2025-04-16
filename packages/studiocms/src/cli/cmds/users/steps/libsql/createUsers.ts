import { StudioCMSColorwayError, StudioCMSColorwayInfo } from '@withstudiocms/cli-kit/colors';
import { z } from 'astro/zod';
import dotenv from 'dotenv';
import checkIfUnsafe from '../../../../../lib/auth/utils/unsafeCheck.js';
import type { Context } from '../../../../lib/context.js';
import { tsPermissions, tsUsers, useLibSQLDb } from '../../../../lib/useLibSQLDb.js';
import { createUserAvatar } from '../utils/avatar.js';
import { checkRequiredEnvVars } from '../utils/checkRequiredEnvVars.js';
import { hashPassword } from '../utils/password.js';

dotenv.config();

export async function libsqlCreateUsers(context: Context) {
	context.debug && context.logger.debug('Running libsqlUsers...');

	context.debug && context.logger.debug('Checking for environment variables');

	const { ASTRO_DB_REMOTE_URL, ASTRO_DB_APP_TOKEN, CMS_ENCRYPTION_KEY } = process.env;

	checkRequiredEnvVars(context, [
		'ASTRO_DB_REMOTE_URL',
		'ASTRO_DB_APP_TOKEN',
		'CMS_ENCRYPTION_KEY',
	]);

	// Environment variables are already checked by checkRequiredEnvVars
	const db = useLibSQLDb(ASTRO_DB_REMOTE_URL as string, ASTRO_DB_APP_TOKEN as string);

	const currentUsers = await db.select().from(tsUsers);

	const inputData = await context.p.group(
		{
			username: () =>
				context.p.text({
					message: 'Username',
					placeholder: 'johndoe',
					validate: (user) => {
						const isUser = currentUsers.find(({ username }) => username === user);
						if (isUser) return 'Username is already in use, please try another one';
						if (checkIfUnsafe(user).username()) {
							return 'Username should not be a commonly used unsafe username (admin, root, etc.)';
						}
						return undefined;
					},
				}),
			name: () =>
				context.p.text({
					message: 'Display Name',
					placeholder: 'John Doe',
				}),
			email: () =>
				context.p.text({
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
				context.p.password({
					message: 'Password',
					validate: (password) => {
						if (password.length < 6 || password.length > 255) {
							return 'Password must be between 6 and 255 characters';
						}
						// Check if password is known unsafe password
						if (checkIfUnsafe(password).password()) {
							return 'Password must not be a commonly known unsafe password (admin, root, etc.)';
						}

						// Check for complexity requirements
						const hasUpperCase = /[A-Z]/.test(password);
						const hasLowerCase = /[a-z]/.test(password);
						const hasNumbers = /\d/.test(password);
						const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password);

						if (!(hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChars)) {
							return 'Password must include at least one uppercase letter, one lowercase letter, one number, and one special character';
						}
						return undefined;
					},
				}),
			confirmPassword: () =>
				context.p.password({
					message: 'Confirm Password',
				}),
			rank: () =>
				context.p.select({
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
			onCancel: () => context.pOnCancel(),
		}
	);

	const { confirmPassword, email, name, newPassword, rank, username } = inputData;

	if (newPassword !== confirmPassword) {
		context.p.log.error('Passwords do not match!');
		context.exit(1);
	}

	// Environment variables are already checked by checkRequiredEnvVars
	const password = await hashPassword(newPassword, CMS_ENCRYPTION_KEY as string);

	const newUserId = crypto.randomUUID();

	const newUser: typeof tsUsers.$inferInsert = {
		id: newUserId,
		name,
		username,
		email,
		password,
		createdAt: new Date(),
		updatedAt: new Date(),
		avatar: await createUserAvatar(email),
	};

	const newRank: typeof tsPermissions.$inferInsert = {
		user: newUserId,
		rank,
	};

	if (context.dryRun) {
		context.tasks.push({
			title: `${StudioCMSColorwayInfo.bold('--dry-run')} ${context.c.dim('Skipping user creation')}`,
			task: async (message) => {
				message('Creating user... (skipped)');
			},
		});
	} else {
		context.tasks.push({
			title: context.c.dim('Creating user...'),
			task: async (message) => {
				try {
					const [insertedUser, insertedRank] = await db.batch([
						db.insert(tsUsers).values(newUser).returning(),
						db.insert(tsPermissions).values(newRank).returning(),
					]);

					if (insertedUser.length === 0 || insertedRank.length === 0) {
						message('Failed to create user or assign permissions');
						context.logger.debug(
							`User insertion results: ${JSON.stringify({
								userInserted: insertedUser.length > 0,
								permissionsInserted: insertedRank.length > 0,
							})}`
						);
						context.exit(1);
					}

					message('User created Successfully');
				} catch (e) {
					if (e instanceof Error) {
						context.p.log.error(StudioCMSColorwayError(`Error: ${e.message}`));
						context.exit(1);
					} else {
						context.p.log.error(StudioCMSColorwayError('Unknown Error: Unable to create user.'));
						context.exit(1);
					}
				}
			},
		});
	}
}
