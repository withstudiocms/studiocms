import { StudioCMSColorwayError, StudioCMSColorwayInfo } from '@withstudiocms/cli-kit/colors';
import { log, note, select, text } from '@withstudiocms/effect/clack';
import { eq } from 'drizzle-orm';
import { Effect, runEffect } from '../../../../effect.js';
import { buildDebugLogger } from '../../../utils/logger.js';
import type { EffectStepFn } from '../../../utils/types.js';
import { libSQLDrizzleClient, Permissions, Users } from '../../../utils/useLibSQLDb.js';
import { getCheckers, hashPassword, verifyPasswordStrength } from '../../../utils/user-utils.js';

export enum UserFieldOption {
	password = 'password',
	username = 'username',
	name = 'name',
}

export const libsqlModifyUsers: EffectStepFn = Effect.fn(function* (context, debug, dryRun) {
	const [checker, debugLogger] = yield* Effect.all([getCheckers, buildDebugLogger(debug)]);

	const { ASTRO_DB_REMOTE_URL, ASTRO_DB_APP_TOKEN } = process.env;

	const [_drop, db] = yield* Effect.all([
		debugLogger('Running libsqlUsers...'),
		libSQLDrizzleClient(ASTRO_DB_REMOTE_URL as string, ASTRO_DB_APP_TOKEN as string),
	]);

	yield* debugLogger('Getting Users from DB...');

	const [currentUsers, currentPermissions] = yield* db.execute((tx) =>
		tx.batch([tx.select().from(Users), tx.select().from(Permissions)])
	);

	if (currentUsers.length === 0) {
		yield* note('There are no users in the database.', 'No Users Available');
		yield* context.exit(0);
	}

	const allUsers: { value: string; label: string; hint?: string }[] = [];

	for (const user of currentUsers) {
		allUsers.push({
			value: user.id,
			label: user.username,
			hint: currentPermissions.find((perm) => perm.user === user.id)?.rank,
		});
	}

	const userSelection = yield* select({
		message: 'Select a user to modify',
		options: allUsers,
	});

	if (typeof userSelection === 'symbol') {
		yield* context.pCancel(userSelection);
		return yield* context.exit(0);
	}

	yield* note(`User ID Selected: ${userSelection}`);

	const action = yield* select({
		message: 'Which user field would you like to update?',
		options: [
			{ value: UserFieldOption.password, label: 'Password' },
			{ value: UserFieldOption.username, label: 'Username' },
			{ value: UserFieldOption.name, label: 'Display Name' },
		],
	});

	switch (action) {
		case UserFieldOption.name: {
			const newDisplayName = yield* text({
				message: 'Enter new display name',
				placeholder: currentUsers.find((u) => u.id === userSelection)?.name || 'John Doe',
			});

			if (typeof newDisplayName === 'symbol') {
				yield* context.pCancel(newDisplayName);
				return yield* context.exit(0);
			}

			if (dryRun) {
				context.tasks.push({
					title: `${StudioCMSColorwayInfo.bold('--dry-run')} ${context.chalk.dim('Skipping user modification')}`,
					task: async (message) => {
						message('Modifying user... (skipped)');
					},
				});
			} else {
				context.tasks.push({
					title: context.chalk.dim('Modifying user...'),
					task: async (message) => {
						try {
							await runEffect(
								db.execute((tx) =>
									tx.update(Users).set({ name: newDisplayName }).where(eq(Users.id, userSelection))
								)
							);

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
			const newUsername = yield* text({
				message: 'Enter new username',
				placeholder: currentUsers.find((u) => u.id === userSelection)?.username || 'johndoe',
				validate: (user) => {
					const u = user.trim();
					const isUser = currentUsers.find(({ username }) => username === u);
					if (isUser) return 'Username is already in use, please try another one';
					if (Effect.runSync(checker.username(u))) {
						return 'Username should not be a commonly used unsafe username (admin, root, etc.)';
					}
					return undefined;
				},
			});

			if (typeof newUsername === 'symbol') {
				yield* context.pCancel(newUsername);
				return yield* context.exit(0);
			}

			if (dryRun) {
				context.tasks.push({
					title: `${StudioCMSColorwayInfo.bold('--dry-run')} ${context.chalk.dim('Skipping user modification')}`,
					task: async (message) => {
						message('Modifying user... (skipped)');
					},
				});
			} else {
				context.tasks.push({
					title: context.chalk.dim('Modifying user...'),
					task: async (message) => {
						try {
							await runEffect(
								db.execute((tx) =>
									tx.update(Users).set({ username: newUsername }).where(eq(Users.id, userSelection))
								)
							);

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
			const newPassword = yield* text({
				message: `Enter the user's new password`,
				validate: (password) => {
					const passCheck = Effect.runSync(verifyPasswordStrength(password));
					if (passCheck !== true) {
						return passCheck;
					}
					return undefined;
				},
			});

			if (typeof newPassword === 'symbol') {
				yield* context.pCancel(newPassword);
				return yield* context.exit(0);
			}

			if (dryRun) {
				context.tasks.push({
					title: `${StudioCMSColorwayInfo.bold('--dry-run')} ${context.chalk.dim('Skipping user modification')}`,
					task: async (message) => {
						message('Modifying user... (skipped)');
					},
				});
			} else {
				context.tasks.push({
					title: context.chalk.dim('Modifying user...'),
					task: async (message) => {
						try {
							// Environment variables are already checked by checkRequiredEnvVars
							const hashedPassword = await runEffect(hashPassword(newPassword));
							await runEffect(
								db.execute((tx) =>
									tx
										.update(Users)
										.set({ password: hashedPassword })
										.where(eq(Users.id, userSelection))
								)
							);

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
			yield* context.pCancel(action);
			return yield* context.exit(0);
		}
	}
});
