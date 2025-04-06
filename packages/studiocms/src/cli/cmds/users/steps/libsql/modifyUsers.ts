import color from 'chalk';
import dotenv from 'dotenv';
import { eq } from 'drizzle-orm';
import checkIfUnsafe from '../../../../../lib/auth/utils/unsafeCheck.js';
import type { Context } from '../../../../lib/context.js';
import { tsPermissions, tsUsers, useLibSQLDb } from '../../../../lib/useLibSQLDb.js';
import { StudioCMSColorwayError, StudioCMSColorwayInfo } from '../../../../lib/utils.js';
import { checkRequiredEnvVars } from '../utils/checkRequiredEnvVars.js';
import { hashPassword } from '../utils/password.js';

dotenv.config();

export async function libsqlModifyUsers(context: Context) {
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

	context.debug && context.logger.debug('Getting Users from DB...');

	const allUsers: { value: string; label: string; hint?: string }[] = [];

	const [currentUsers, currentPermissions] = await db.batch([
		db.select().from(tsUsers),
		db.select().from(tsPermissions),
	]);

	if (currentUsers.length === 0) {
		context.p.note('There are no users in the database.', 'No Users Available');
		context.exit(0);
	}

	for (const user of currentUsers) {
		allUsers.push({
			value: user.id,
			label: user.username,
			hint: currentPermissions.find((userRank) => userRank.user === user.id)?.rank,
		});
	}

	const userSelection = await context.p.select({
		message: 'Which user would you like to update?',
		options: allUsers,
	});

	if (typeof userSelection === 'symbol') {
		context.pCancel(userSelection);
		context.exit(0);
	}

	context.p.note(`User ID Selected: ${userSelection}`);

	const action = await context.p.select({
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
			const newDisplayName = await context.p.text({
				message: `Enter the user's new Display name`,
				placeholder: 'John Doe',
			});

			if (typeof newDisplayName === 'symbol') {
				context.pCancel(newDisplayName);
				context.exit(0);
			}

			if (context.dryRun) {
				context.tasks.push({
					title: `${StudioCMSColorwayInfo.bold('--dry-run')} ${color.dim('Skipping user modification')}`,
					task: async (message) => {
						message('Modifying user... (skipped)');
					},
				});
			} else {
				context.tasks.push({
					title: color.dim('Modifying user...'),
					task: async (message) => {
						try {
							await db
								.update(tsUsers)
								.set({ name: newDisplayName })
								.where(eq(tsUsers.id, userSelection));

							message('User modified successfully');
						} catch (e) {
							if (e instanceof Error) {
								context.p.log.error(StudioCMSColorwayError(`Error: ${e.message}`));
								context.exit(1);
							} else {
								context.p.log.error(
									StudioCMSColorwayError('Unknown Error: Unable to modify user.')
								);
								context.exit(1);
							}
						}
					},
				});
			}
			break;
		}
		case 'username': {
			const newUserName = await context.p.text({
				message: `Enter the user's new username`,
				placeholder: 'johndoe',
				validate: (user) => {
					const isUser = currentUsers.find(({ username }) => username === user);
					if (isUser) return 'Username is already in use, please try another one';
					if (checkIfUnsafe(user).username()) {
						return 'Username should not be a commonly used unsafe username (admin, root, etc.)';
					}
					return undefined;
				},
			});

			if (typeof newUserName === 'symbol') {
				context.pCancel(newUserName);
				context.exit(0);
			}

			if (context.dryRun) {
				context.tasks.push({
					title: `${StudioCMSColorwayInfo.bold('--dry-run')} ${color.dim('Skipping user modification')}`,
					task: async (message) => {
						message('Modifying user... (skipped)');
					},
				});
			} else {
				context.tasks.push({
					title: color.dim('Modifying user...'),
					task: async (message) => {
						try {
							await db
								.update(tsUsers)
								.set({ username: newUserName })
								.where(eq(tsUsers.id, userSelection));

							message('User modified successfully');
						} catch (e) {
							if (e instanceof Error) {
								context.p.log.error(StudioCMSColorwayError(`Error: ${e.message}`));
								context.exit(1);
							} else {
								context.p.log.error(
									StudioCMSColorwayError('Unknown Error: Unable to modify user.')
								);
								context.exit(1);
							}
						}
					},
				});
			}
			break;
		}
		case 'password': {
			const newPassword = await context.p.password({
				message: `Enter the user's new password`,
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
			});

			if (typeof newPassword === 'symbol') {
				context.pCancel(newPassword);
				context.exit(0);
			}

			if (context.dryRun) {
				context.tasks.push({
					title: `${StudioCMSColorwayInfo.bold('--dry-run')} ${color.dim('Skipping user modification')}`,
					task: async (message) => {
						message('Modifying user... (skipped)');
					},
				});
			} else {
				context.tasks.push({
					title: color.dim('Modifying user...'),
					task: async (message) => {
						try {
							// Environment variables are already checked by checkRequiredEnvVars
							const hashedPassword = await hashPassword(newPassword, CMS_ENCRYPTION_KEY as string);

							await db
								.update(tsUsers)
								.set({ password: hashedPassword })
								.where(eq(tsUsers.id, userSelection));

							message('User modified successfully');
						} catch (e) {
							if (e instanceof Error) {
								context.p.log.error(StudioCMSColorwayError(`Error: ${e.message}`));
								context.exit(1);
							} else {
								context.p.log.error(
									StudioCMSColorwayError('Unknown Error: Unable to modify user.')
								);
								context.exit(1);
							}
						}
					},
				});
			}
			break;
		}
	}
}
