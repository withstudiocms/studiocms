import { StudioCMSColorwayError, StudioCMSColorwayInfo } from '@withstudiocms/cli-kit/colors';
import { z } from 'astro/zod';
import dotenv from 'dotenv';
import { convertToVanilla, Effect } from '../../../effect.js';
import { CheckIfUnsafe, type CheckIfUnsafeError } from '../../../lib/auth/utils/unsafeCheck.js';
import { checkRequiredEnvVars } from '../../utils/checkRequiredEnvVars.js';
import { createUserAvatar } from '../../utils/createUserAvatar.js';
import { logger } from '../../utils/logger.js';
import type { StepFn } from '../../utils/types.js';
import { Permissions, Users, useLibSQLDb } from '../../utils/useLibSQLDb.js';
import { hashPassword } from '../../utils/user-utils.js';

dotenv.config();

type Checker = Awaited<{
	username: (val: string) => Effect.Effect<boolean, CheckIfUnsafeError, never>;
	password: (val: string) => Effect.Effect<boolean, CheckIfUnsafeError, never>;
}> | null;

let checker: Checker = null;

const getChecker = async () => {
	if (!checker) {
		checker = await Effect.runPromise(
			Effect.gen(function* () {
				const { _tag, ...mod } = yield* CheckIfUnsafe;
				return mod;
			}).pipe(Effect.provide(CheckIfUnsafe.Default))
		);
	}
	return checker;
};

export const libsqlCreateUsers: StepFn = async (context, debug, dryRun = false) => {
	const { chalk, prompts } = context;

	const checker: Checker = await getChecker();

	debug && logger.debug('Running libsqlUsers...');

	debug && logger.debug('Checking for environment variables');

	const { ASTRO_DB_REMOTE_URL, ASTRO_DB_APP_TOKEN } = process.env;

	checkRequiredEnvVars(['ASTRO_DB_REMOTE_URL', 'ASTRO_DB_APP_TOKEN', 'CMS_ENCRYPTION_KEY']);

	// Environment variables are already checked by checkRequiredEnvVars
	const db = useLibSQLDb(ASTRO_DB_REMOTE_URL as string, ASTRO_DB_APP_TOKEN as string);

	const currentUsers = await db.select().from(Users);

	const inputData = await prompts.group(
		{
			username: () =>
				prompts.text({
					message: 'Username',
					placeholder: 'johndoe',
					validate: (user) => {
						const isUser = currentUsers.find(({ username }) => username === user);
						if (isUser) return 'Username is already in use, please try another one';
						if (Effect.runSync(checker.username(user))) {
							return 'Username should not be a commonly used unsafe username (admin, root, etc.)';
						}
						return undefined;
					},
				}),
			name: () =>
				prompts.text({
					message: 'Display Name',
					placeholder: 'John Doe',
				}),
			email: () =>
				prompts.text({
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
				prompts.password({
					message: 'Password',
					validate: (password) => {
						if (password.length < 6 || password.length > 255) {
							return 'Password must be between 6 and 255 characters';
						}
						// Check if password is known unsafe password
						if (Effect.runSync(checker.password(password))) {
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
				prompts.password({
					message: 'Confirm Password',
				}),
			rank: () =>
				prompts.select({
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
		prompts.log.error('Passwords do not match!');
		context.exit(1);
	}

	// Environment variables are already checked by checkRequiredEnvVars
	const password = await convertToVanilla(hashPassword(newPassword));

	const newUserId = crypto.randomUUID();

	const newUser: typeof Users.$inferInsert = {
		id: newUserId,
		name,
		username,
		email,
		password,
		createdAt: new Date(),
		updatedAt: new Date(),
		avatar: await createUserAvatar(email),
	};

	const newRank: typeof Permissions.$inferInsert = {
		user: newUserId,
		rank,
	};

	if (dryRun) {
		context.tasks.push({
			title: `${StudioCMSColorwayInfo.bold('--dry-run')} ${chalk.dim('Skipping user creation')}`,
			task: async (message) => {
				message('Creating user... (skipped)');
			},
		});
	} else {
		context.tasks.push({
			title: chalk.dim('Creating user...'),
			task: async (message) => {
				try {
					const [insertedUser, insertedRank] = await db.batch([
						db.insert(Users).values(newUser).returning(),
						db.insert(Permissions).values(newRank).returning(),
					]);

					if (insertedUser.length === 0 || insertedRank.length === 0) {
						message('Failed to create user or assign permissions');
						logger.debug(
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
						prompts.log.error(StudioCMSColorwayError(`Error: ${e.message}`));
						context.exit(1);
					} else {
						prompts.log.error(StudioCMSColorwayError('Unknown Error: Unable to create user.'));
						context.exit(1);
					}
				}
			},
		});
	}
};
