import { StudioCMSColorwayError, StudioCMSColorwayInfo } from '@withstudiocms/cli-kit/colors';
import dotenv from 'dotenv';
import { eq } from 'drizzle-orm';
import { Effect, convertToVanilla } from '../../../effect.js';
import { CheckIfUnsafe } from '../../../lib/auth/utils/unsafeCheck.js';
import { checkRequiredEnvVars } from '../../utils/checkRequiredEnvVars.js';
import { logger } from '../../utils/logger.js';
import type { StepFn } from '../../utils/types.js';
import { Permissions, Users, useLibSQLDb } from '../../utils/useLibSQLDb.js';
import { hashPassword } from '../../utils/user-utils.js';

dotenv.config();

export const libsqlModifyUsers: StepFn = async (context, debug, dryRun = false) => {
	const { prompts, chalk } = context;

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
		prompts.note('There are no users in the database.', 'No Users Available');
		context.exit(0);
	}

	for (const user of currentUsers) {
		allUsers.push({
			value: user.id,
			label: user.username,
			hint: currentPermissions.find((userRank) => userRank.user === user.id)?.rank,
		});
	}

	const userSelection = await prompts.select({
		message: 'Which user would you like to update?',
		options: allUsers,
	});

	if (typeof userSelection === 'symbol') {
		context.pCancel(userSelection);
		context.exit(0);
		return;
	}

	prompts.note(`User ID Selected: ${userSelection}`);

	const action = await prompts.select({
		message: 'Which user field would you like to update?',
		options: [
			{ value: 'password', label: 'Password' },
			{ value: 'username', label: 'Username' },
			{ value: 'name', label: 'Display Name' },
		],
	});

	if (typeof action === 'symbol') {
		context.pCancel(action);
		context.exit(0);
	}

	switch (action) {
		case 'name': {
			const newDisplayName = await prompts.text({
				message: `Enter the user's new Display name`,
				placeholder: 'John Doe',
			});

			if (typeof newDisplayName === 'symbol') {
				context.pCancel(newDisplayName);
				context.exit(0);
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
								prompts.log.error(StudioCMSColorwayError(`Error: ${e.message}`));
								context.exit(1);
							} else {
								prompts.log.error(StudioCMSColorwayError('Unknown Error: Unable to modify user.'));
								context.exit(1);
							}
						}
					},
				});
			}
			break;
		}
		case 'username': {
			const newUserName = await prompts.text({
				message: `Enter the user's new username`,
				placeholder: 'johndoe',
				validate: (user) => {
					const isUser = currentUsers.find(({ username }) => username === user);
					if (isUser) return 'Username is already in use, please try another one';
					if (
						Effect.runSync(CheckIfUnsafe.username(user).pipe(Effect.provide(CheckIfUnsafe.Default)))
					) {
						return 'Username should not be a commonly used unsafe username (admin, root, etc.)';
					}
					return undefined;
				},
			});

			if (typeof newUserName === 'symbol') {
				context.pCancel(newUserName);
				context.exit(0);
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
								prompts.log.error(StudioCMSColorwayError(`Error: ${e.message}`));
								context.exit(1);
							} else {
								prompts.log.error(StudioCMSColorwayError('Unknown Error: Unable to modify user.'));
								context.exit(1);
							}
						}
					},
				});
			}
			break;
		}
		case 'password': {
			const newPassword = await prompts.password({
				message: `Enter the user's new password`,
				validate: (password) => {
					if (password.length < 6 || password.length > 255) {
						return 'Password must be between 6 and 255 characters';
					}

					// Check if password is known unsafe password
					if (
						Effect.runSync(
							CheckIfUnsafe.password(password).pipe(Effect.provide(CheckIfUnsafe.Default))
						)
					) {
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
			});

			if (typeof newPassword === 'symbol') {
				context.pCancel(newPassword);
				context.exit(0);
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
							const hashedPassword = await convertToVanilla(hashPassword(newPassword));

							await db
								.update(Users)
								.set({ password: hashedPassword })
								.where(eq(Users.id, userSelection));

							message('User modified successfully');
						} catch (e) {
							if (e instanceof Error) {
								prompts.log.error(StudioCMSColorwayError(`Error: ${e.message}`));
								context.exit(1);
							} else {
								prompts.log.error(StudioCMSColorwayError('Unknown Error: Unable to modify user.'));
								context.exit(1);
							}
						}
					},
				});
			}
			break;
		}
	}
};
