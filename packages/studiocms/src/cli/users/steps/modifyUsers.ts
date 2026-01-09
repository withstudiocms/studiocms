import { StudioCMSColorwayError, StudioCMSColorwayInfo } from '@withstudiocms/cli-kit/colors';
import { runEffect } from '@withstudiocms/effect';
import { log, note, password, select, text } from '@withstudiocms/effect/clack';
import { StudioCMSPermissions, StudioCMSUsersTable } from '@withstudiocms/sdk/tables';
import { Effect, Schema } from 'effect';
import { StudioCMSCliError } from '../../utils/errors.js';
import { getCliDbClient } from '../../utils/getCliDbClient.js';
import type { EffectStepFn } from '../../utils/types.js';
import { getCheckers, hashPassword, verifyPasswordStrength } from '../../utils/user-utils.js';
import { validateInputOrRePrompt } from '../shared.js';

export enum UserFieldOption {
	password = 'password',
	username = 'username',
	name = 'name',
}

export const modifyUsers: EffectStepFn = Effect.fn(function* (context, _debug, dryRun) {
	const [checker, dbClient] = yield* Effect.all([
		getCheckers,
		getCliDbClient(context).pipe(
			Effect.mapError(
				(error) =>
					new StudioCMSCliError({ message: `Failed to get database client: ${error.message}` })
			)
		),
	]);

	/**
	 * Get the current users from the database.
	 */
	const _getCurrentUsers = dbClient.withDecoder({
		decoder: Schema.Array(StudioCMSUsersTable.Select),
		callbackFn: (client) =>
			client((db) =>
				db.selectFrom('StudioCMSUsersTable').selectAll().orderBy('name', 'asc').execute()
			),
	});

	/**
	 * Get the current permissions from the database.
	 */
	const _getCurrentPermissions = dbClient.withDecoder({
		decoder: Schema.Array(StudioCMSPermissions.Select),
		callbackFn: (client) =>
			client((db) => db.selectFrom('StudioCMSPermissions').selectAll().execute()),
	});

	const _updateUser = dbClient.withCodec({
		decoder: StudioCMSUsersTable.Select,
		encoder: Schema.Struct({
			key: Schema.Union(
				Schema.Literal('name'),
				Schema.Literal('username'),
				Schema.Literal('password')
			),
			value: Schema.String,
			id: Schema.String,
		}),
		callbackFn: (db, { key, value, id }) =>
			db((client) =>
				client.transaction().execute(async (trx) => {
					await trx
						.updateTable('StudioCMSUsersTable')
						.set({ [key]: value })
						.where('id', '=', id)
						.executeTakeFirstOrThrow();

					return await trx
						.selectFrom('StudioCMSUsersTable')
						.selectAll()
						.where('id', '=', id)
						.executeTakeFirstOrThrow();
				})
			),
	});

	const currentUsers = yield* _getCurrentUsers();

	// Assemble user options for selection
	const allUsers: { value: string; label: string; hint?: string }[] = yield* Effect.all({
		permissions: _getCurrentPermissions(),
	}).pipe(
		Effect.map(({ permissions }) =>
			currentUsers.map((user) => ({
				value: user.id,
				label: user.username,
				hint: permissions.find((perm) => perm.user === user.id)?.rank,
			}))
		)
	);

	if (allUsers.length === 0) {
		yield* note('There are no users in the database.', 'No Users Available');
		return yield* context.exit(0);
	}

	const userSelection = yield* select({
		message: 'Select a user to modify',
		options: allUsers,
	});

	if (typeof userSelection === 'symbol') {
		return yield* context.pCancel(userSelection);
	}

	yield* note(`User ID Selected: ${userSelection}`);

	const usernamePrompt = validateInputOrRePrompt({
		prompt: text({
			message: 'Enter the new username',
			placeholder: 'johndoe',
			validate: (user) => {
				const u = user.trim();
				const isUser = currentUsers.find(({ username }) => username === u);
				if (isUser) return 'Username is already in use, please try another one';
				return undefined;
			},
		}),
		checkEffect: (username) =>
			checker.username(username).pipe(
				Effect.map((result) => {
					// checkEffect expects true for valid input, otherwise a string error message
					// we invert the logic here since the checker returns true for commonly used usernames
					if (result !== true) {
						return true;
					}
					return 'Username is a commonly used username. (i.e. admin, user, test)';
				}),
				Effect.catchAll(() =>
					Effect.succeed('Username is a commonly used username. (i.e. admin, user, test)')
				)
			),
	});

	const passwordPrompt = validateInputOrRePrompt({
		prompt: password({
			message: 'Enter the new password',
		}),
		checkEffect: (pass) =>
			verifyPasswordStrength(pass).pipe(
				Effect.catchAll(() => Effect.succeed('Password does not meet strength requirements'))
			),
	});

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
				validate: (v) => (v.trim().length === 0 ? 'Display name cannot be empty' : undefined),
			});

			if (typeof newDisplayName === 'symbol') {
				return yield* context.pCancel(newDisplayName);
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
								_updateUser({
									key: 'name',
									value: newDisplayName,
									id: userSelection,
								})
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
			const newUsername = yield* usernamePrompt;

			if (typeof newUsername === 'symbol') {
				return yield* context.pCancel(newUsername);
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
								_updateUser({
									key: 'username',
									value: newUsername,
									id: userSelection,
								})
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
			const newPassword = yield* passwordPrompt;

			if (typeof newPassword === 'symbol') {
				return yield* context.pCancel(newPassword);
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
								_updateUser({
									key: 'password',
									value: hashedPassword,
									id: userSelection,
								})
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
		default:
			return yield* context.pCancel(action);
	}
});
