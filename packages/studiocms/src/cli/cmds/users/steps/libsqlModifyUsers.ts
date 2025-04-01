import color from 'chalk';
import dotenv from 'dotenv';
import { eq } from 'drizzle-orm';
import checkIfUnsafe from '../../../../lib/auth/utils/unsafeCheck.js';
import type { Context } from '../../../lib/context.js';
import { tsPermissions, tsUsers, useLibSQLDb } from '../../../lib/useLibSQLDb.js';
import { StudioCMSColorwayError, StudioCMSColorwayInfo } from '../../../lib/utils.js';
import { checkRequiredEnvVars } from './utils/checkRequiredEnvVars.js';
import { hashPassword } from './utils/password.js';

dotenv.config();

export async function libsqlModifyUsers(ctx: Context) {
	ctx.debug && ctx.logger.debug('Running libsqlUsers...');

	ctx.debug && ctx.logger.debug('Checking for environment variables');

	const { ASTRO_DB_REMOTE_URL, ASTRO_DB_APP_TOKEN, CMS_ENCRYPTION_KEY } = process.env;

	checkRequiredEnvVars(ctx, ['ASTRO_DB_REMOTE_URL', 'ASTRO_DB_APP_TOKEN', 'CMS_ENCRYPTION_KEY']);

	// Environment variables are already checked by checkRequiredEnvVars
	const db = useLibSQLDb(ASTRO_DB_REMOTE_URL as string, ASTRO_DB_APP_TOKEN as string);

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

			if (ctx.dryRun) {
				ctx.tasks.push({
					title: `${StudioCMSColorwayInfo.bold('--dry-run')} ${color.dim('Skipping user modification')}`,
					task: async (message) => {
						message('Modifying user... (skipped)');
					},
				});
			} else {
				ctx.tasks.push({
					title: color.dim('Modifying user...'),
					task: async (message) => {
						try {
							await db
								.update(tsUsers)
								.set({ name: newDisplayName })
								.where(eq(tsUsers.id, userSelection));

							message('User modified Successfully');
						} catch (e) {
							if (e instanceof Error) {
								ctx.p.log.error(StudioCMSColorwayError(`Error: ${e.message}`));
								ctx.exit(1);
							} else {
								ctx.p.log.error(StudioCMSColorwayError('Unknown Error: Unable to modify user.'));
								ctx.exit(1);
							}
						}
					},
				});
			}
			break;
		}
		case 'username': {
			const newUserName = await ctx.p.text({
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
				ctx.pCancel(newUserName);
				ctx.exit(0);
			}

			if (ctx.dryRun) {
				ctx.tasks.push({
					title: `${StudioCMSColorwayInfo.bold('--dry-run')} ${color.dim('Skipping user modification')}`,
					task: async (message) => {
						message('Modifying user... (skipped)');
					},
				});
			} else {
				ctx.tasks.push({
					title: color.dim('Modifying user...'),
					task: async (message) => {
						try {
							await db
								.update(tsUsers)
								.set({ username: newUserName })
								.where(eq(tsUsers.id, userSelection));

							message('User modified Successfully');
						} catch (e) {
							if (e instanceof Error) {
								ctx.p.log.error(StudioCMSColorwayError(`Error: ${e.message}`));
								ctx.exit(1);
							} else {
								ctx.p.log.error(StudioCMSColorwayError('Unknown Error: Unable to modify user.'));
								ctx.exit(1);
							}
						}
					},
				});
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
				ctx.pCancel(newPassword);
				ctx.exit(0);
			}

			if (ctx.dryRun) {
				ctx.tasks.push({
					title: `${StudioCMSColorwayInfo.bold('--dry-run')} ${color.dim('Skipping user modification')}`,
					task: async (message) => {
						message('Modifying user... (skipped)');
					},
				});
			} else {
				ctx.tasks.push({
					title: color.dim('Modifying user...'),
					task: async (message) => {
						try {
							// Environment variables are already checked by checkRequiredEnvVars
							const hashedPassword = await hashPassword(newPassword, CMS_ENCRYPTION_KEY as string);

							await db
								.update(tsUsers)
								.set({ password: hashedPassword })
								.where(eq(tsUsers.id, userSelection));

							message('User modified Successfully');
						} catch (e) {
							if (e instanceof Error) {
								ctx.p.log.error(StudioCMSColorwayError(`Error: ${e.message}`));
								ctx.exit(1);
							} else {
								ctx.p.log.error(StudioCMSColorwayError('Unknown Error: Unable to modify user.'));
								ctx.exit(1);
							}
						}
					},
				});
			}
			break;
		}
	}
}
