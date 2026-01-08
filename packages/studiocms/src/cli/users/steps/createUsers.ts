import { getAvatarUrl } from '@withstudiocms/auth-kit/utils/libravatar';
import { StudioCMSColorwayInfo } from '@withstudiocms/cli-kit/colors';
import { group, log, password, select, text } from '@withstudiocms/effect/clack';
import { StudioCMSPermissions, StudioCMSUsersTable } from '@withstudiocms/sdk/tables';
import { z } from 'astro/zod';
import { Effect, runEffect, Schema } from '../../../effect.js';
import { StudioCMSCliError } from '../../utils/errors.js';
import { getCliDbClient } from '../../utils/getCliDbClient.js';
import type { EffectStepFn } from '../../utils/types.js';
import { getCheckers, hashPassword, verifyPasswordStrength } from '../../utils/user-utils.js';
import { validateInputOrRePrompt } from '../shared.js';

/**
 * Step to create new users in the database.
 *
 * @param context - The CLI base context.
 * @param _debug - The debug flag.
 * @param dryRun - The dry run flag.
 *
 * @return An effect representing the user creation step.
 */
export const createUsers: EffectStepFn = Effect.fn(function* (context, _debug, dryRun) {
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
	 * Create a new user in the database.
	 */
	const _createUser = dbClient.withCodec({
		encoder: StudioCMSUsersTable.Insert,
		decoder: StudioCMSUsersTable.Select,
		callbackFn: (client, user) =>
			client(
				(db) =>
					db
						.insertInto('StudioCMSUsersTable')
						.values(user)
						.returningAll()
						// Added type assertion due to weirdness with generics return types
						.executeTakeFirstOrThrow() as Promise<(typeof StudioCMSUsersTable.Select)['Encoded']>
			),
	});

	/**
	 * Create a new permission rank for a user in the database.
	 */
	const _createRank = dbClient.withCodec({
		decoder: StudioCMSPermissions.Select,
		encoder: StudioCMSPermissions.Insert,
		callbackFn: (client, permission) =>
			client((db) =>
				db
					.insertInto('StudioCMSPermissions')
					.values(permission)
					.returningAll()
					.executeTakeFirstOrThrow()
			),
	});

	/**
	 * Type for a user to be inserted into the database.
	 */
	type InsertUser = Parameters<typeof _createUser>[0];

	/**
	 * Type for a permission rank to be inserted into the database.
	 */
	type InsertPermission = Parameters<typeof _createRank>[0];

	/**
	 * Current DB users.
	 */
	const currentUsers = yield* _getCurrentUsers();

	const usernamePrompt = validateInputOrRePrompt({
		prompt: text({
			message: 'Username',
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
					// If the result is true, the username is invalid
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
			message: 'Password',
		}),
		checkEffect: (pass) =>
			verifyPasswordStrength(pass).pipe(
				Effect.catchAll(() => Effect.succeed('Password does not meet strength requirements'))
			),
	});

	// Collect input data
	const inputData = yield* group(
		{
			username: async () => await runEffect(usernamePrompt),
			name: async () =>
				await runEffect(
					text({
						message: 'Display Name',
						placeholder: 'John Doe',
					})
				),
			email: async () =>
				await runEffect(
					text({
						message: 'E-Mail Address',
						placeholder: 'john@doe.tld',
						validate: (email) => {
							const e = email.trim().toLowerCase();
							const emailSchema = z.string().email({ message: 'Email address is invalid' });
							const response = emailSchema.safeParse(e);
							if (!response.success) return response.error.message;
							if (currentUsers.find((user) => user.email === e)) {
								return 'There is already a user with that email.';
							}
							return undefined;
						},
					})
				),
			newPassword: async () => await runEffect(passwordPrompt),
			confirmPassword: async () => await runEffect(password({ message: 'Confirm Password' })),
			rank: async () =>
				await runEffect(
					select<'owner' | 'admin' | 'editor' | 'visitor'>({
						message: 'What Role should this user have?',
						options: [
							{ value: 'visitor', label: 'Visitor' },
							{ value: 'editor', label: 'Editor' },
							{ value: 'admin', label: 'Admin' },
							{ value: 'owner', label: 'Owner' },
						],
					})
				),
		},
		{
			onCancel: async () => await runEffect(context.pOnCancel()),
		}
	);

	// Destructure input data
	const { confirmPassword, email, name, newPassword, rank, username } = inputData;

	// Check password confirmation
	if (newPassword !== confirmPassword) {
		yield* log.error(context.chalk.red('Passwords do not match, exiting...'));
		return yield* context.exit(1);
	}

	// Generate new user ID
	const newUserId = crypto.randomUUID();

	// Hash password and get avatar URL
	const [hashedPassword, avatar] = yield* Effect.all([
		hashPassword(newPassword),
		Effect.tryPromise({
			try: () => getAvatarUrl({ email, https: true, size: 400, default: 'retro' }),
			catch: (cause) => new StudioCMSCliError({ message: 'Failed to fetch avatar URL', cause }),
		}),
	]);

	// Get current timestamp
	const NOW = new Date().toISOString();

	// Create new user object
	const newUser: InsertUser = {
		id: newUserId,
		name,
		username,
		email,
		avatar,
		password: hashedPassword,
		createdAt: NOW,
		updatedAt: NOW,
		emailVerified: false,
	};

	// Create new permission rank object
	const newRank: InsertPermission = {
		user: newUserId,
		rank,
	};

	// Prepare database operations
	const todo = Effect.all([_createUser(newUser), _createRank(newRank)]);

	if (dryRun) {
		// Dry run: skip user creation
		context.tasks.push({
			title: `${StudioCMSColorwayInfo.bold('--dry-run')} ${context.chalk.dim('Skipping user creation')}`,
			task: async (message) => {
				message('Creating user... (skipped)');
			},
		});
	} else {
		// Create user in database
		context.tasks.push({
			title: context.chalk.dim('Creating user...'),
			task: async (message) => {
				try {
					const [insertedUser, insertedRank] = await runEffect(todo);

					if (!insertedUser || !insertedRank) {
						message('Failed to create user or assign permissions');
						return await runEffect(context.exit(1));
					}

					message(context.chalk.green('User created successfully!'));
				} catch (error) {
					await runEffect(log.error(`Failed to create user: ${(error as Error).message}`));
					return await runEffect(context.exit(1));
				}
			},
		});
	}
});
