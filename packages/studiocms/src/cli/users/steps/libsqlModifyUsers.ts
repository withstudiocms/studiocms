import type { CheckIfUnsafeError } from '@withstudiocms/auth-kit/errors';
import { CheckIfUnsafe } from '@withstudiocms/auth-kit/utils/unsafeCheck';
import { StudioCMSColorwayError, StudioCMSColorwayInfo } from '@withstudiocms/cli-kit/colors';
import { log, note, password, select, text } from '@withstudiocms/effect/clack';
import dotenv from 'dotenv';
import { eq } from 'drizzle-orm';
import { Effect, runEffect } from '../../../effect.js';
import { checkRequiredEnvVars } from '../../utils/checkRequiredEnvVars.js';
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

export enum UserFieldOption {
	password = 'password',
	username = 'username',
	name = 'name',
}

export const libsqlModifyUsers: StepFn = async (context, debug, dryRun = false) => {
	const { chalk } = context;

	const checker: Checker = await getChecker();

	debug && logger.debug('Running libsqlUsers...');

	debug && logger.debug('Checking for environment variables');

	const { ASTRO_DB_REMOTE_URL, ASTRO_DB_APP_TOKEN } = process.env;

	checkRequiredEnvVars(['ASTRO_DB_REMOTE_URL', 'ASTRO_DB_APP_TOKEN', 'CMS_ENCRYPTION_KEY']);

	// Environment variables are already checked by checkRequiredEnvVars
	const db = useLibSQLDb(ASTRO_DB_REMOTE_URL as string, ASTRO_DB_APP_TOKEN as string);

	debug && logger.debug('Getting Users from DB...');

	const allUsers: { value: string; label: string; hint?: string }[] = [];

	const [currentUsers, currentPermissions] = await db.batch([
		db.select().from(Users),
		db.select().from(Permissions),
	]);

	if (currentUsers.length === 0) {
		await runEffect(note('There are no users in the database.', 'No Users Available'));
		await runEffect(context.exit(0));
	}

	for (const user of currentUsers) {
		allUsers.push({
			value: user.id,
			label: user.username,
			hint: currentPermissions.find((userRank) => userRank.user === user.id)?.rank,
		});
	}

	const userSelection = await runEffect(
		select({
			message: 'Which user would you like to update?',
			options: allUsers,
		})
	);

	if (typeof userSelection === 'symbol') {
		await runEffect(context.pCancel(userSelection));
		await runEffect(context.exit(0));
		return;
	}

	await runEffect(note(`User ID Selected: ${userSelection}`));

	const action = await runEffect(
		select({
			message: 'Which user field would you like to update?',
			options: [
				{ value: UserFieldOption.password, label: 'Password' },
				{ value: UserFieldOption.username, label: 'Username' },
				{ value: UserFieldOption.name, label: 'Display Name' },
			],
		})
	);

	switch (action) {
		case UserFieldOption.name: {
			const newDisplayName = await runEffect(
				text({
					message: `Enter the user's new Display name`,
					placeholder: 'John Doe',
				})
			);

			if (typeof newDisplayName === 'symbol') {
				await runEffect(context.pCancel(newDisplayName));
				await runEffect(context.exit(0));
				return;
			}

			if (dryRun) {
				context.tasks.push({
					title: `${StudioCMSColorwayInfo.bold('--dry-run')} ${chalk.dim('Skipping user modification')}`,
					task: async (message) => {
						message('Modifying user... (skipped)');
					},
				});
			} else {
				context.tasks.push({
					title: chalk.dim('Modifying user...'),
					task: async (message) => {
						try {
							await db
								.update(Users)
								.set({ name: newDisplayName })
								.where(eq(Users.id, userSelection));

							message('User modified successfully');
						} catch (e) {
							if (e instanceof Error) {
								await runEffect(log.error(StudioCMSColorwayError(`Error: ${e.message}`)));
								await runEffect(context.exit(1));
							} else {
								await runEffect(
									log.error(StudioCMSColorwayError('Unknown Error: Unable to modify user.'))
								);
								await runEffect(context.exit(1));
							}
						}
					},
				});
			}
			break;
		}
		case UserFieldOption.username: {
			const newUserName = await runEffect(
				text({
					message: `Enter the user's new username`,
					placeholder: 'johndoe',
					validate: (user) => {
						const isUser = currentUsers.find(({ username }) => username === user);
						if (isUser) return 'Username is already in use, please try another one';
						if (Effect.runSync(checker.username(user))) {
							return 'Username should not be a commonly used unsafe username (admin, root, etc.)';
						}
						return undefined;
					},
				})
			);

			if (typeof newUserName === 'symbol') {
				await runEffect(context.pCancel(newUserName));
				await runEffect(context.exit(0));
				return;
			}

			if (dryRun) {
				context.tasks.push({
					title: `${StudioCMSColorwayInfo.bold('--dry-run')} ${chalk.dim('Skipping user modification')}`,
					task: async (message) => {
						message('Modifying user... (skipped)');
					},
				});
			} else {
				context.tasks.push({
					title: chalk.dim('Modifying user...'),
					task: async (message) => {
						try {
							await db
								.update(Users)
								.set({ username: newUserName })
								.where(eq(Users.id, userSelection));

							message('User modified successfully');
						} catch (e) {
							if (e instanceof Error) {
								await runEffect(log.error(StudioCMSColorwayError(`Error: ${e.message}`)));
								await runEffect(context.exit(1));
							} else {
								await runEffect(
									log.error(StudioCMSColorwayError('Unknown Error: Unable to modify user.'))
								);
								await runEffect(context.exit(1));
							}
						}
					},
				});
			}
			break;
		}
		case UserFieldOption.password: {
			const newPassword = await runEffect(
				password({
					message: `Enter the user's new password`,
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
				})
			);

			if (typeof newPassword === 'symbol') {
				await runEffect(context.pCancel(newPassword));
				await runEffect(context.exit(0));
				return;
			}

			if (dryRun) {
				context.tasks.push({
					title: `${StudioCMSColorwayInfo.bold('--dry-run')} ${chalk.dim('Skipping user modification')}`,
					task: async (message) => {
						message('Modifying user... (skipped)');
					},
				});
			} else {
				context.tasks.push({
					title: chalk.dim('Modifying user...'),
					task: async (message) => {
						try {
							// Environment variables are already checked by checkRequiredEnvVars
							const hashedPassword = await runEffect(hashPassword(newPassword));

							await db
								.update(Users)
								.set({ password: hashedPassword })
								.where(eq(Users.id, userSelection));

							message('User modified successfully');
						} catch (e) {
							if (e instanceof Error) {
								await runEffect(log.error(StudioCMSColorwayError(`Error: ${e.message}`)));
								await runEffect(context.exit(1));
							} else {
								await runEffect(
									log.error(StudioCMSColorwayError('Unknown Error: Unable to modify user.'))
								);
								await runEffect(context.exit(1));
							}
						}
					},
				});
			}
			break;
		}
		default: {
			await runEffect(context.pCancel(action));
			await runEffect(context.exit(0));
			break;
		}
	}
};
