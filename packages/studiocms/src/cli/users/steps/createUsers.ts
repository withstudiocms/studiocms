import { getAvatarUrl } from '@withstudiocms/auth-kit/utils/libravatar';
import { StudioCMSColorwayInfo } from '@withstudiocms/cli-kit/colors';
import { group, log, password, select, text } from '@withstudiocms/effect/clack';
import { StudioCMSPermissions, StudioCMSUsersTable } from '@withstudiocms/kysely';
import { z } from 'astro/zod';
import { Effect, runEffect, Schema } from '../../../effect.js';
import { getCliDbClient } from '../../utils/getCliDbClient.js';
import type { EffectStepFn } from '../../utils/types.js';
import { getCheckers, hashPassword, verifyPasswordStrength } from '../../utils/user-utils.js';

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
			Effect.catchAll((error) =>
				Effect.fail(new Error(`Failed to get database client: ${error.message}`))
			)
		),
	]);

	/**
	 * Get the current users from the database.
	 */
	const getCurrentUsers = dbClient.withDecoder({
		decoder: Schema.Array(StudioCMSUsersTable.Select),
		callbackFn: (client) =>
			client((db) => db.selectFrom('StudioCMSUsersTable').selectAll().execute()),
	});

	/**
	 * Create a new user in the database.
	 */
	const createUser = dbClient.withCodec({
		decoder: StudioCMSUsersTable.Select,
		encoder: StudioCMSUsersTable.Insert,
		callbackFn: (client, user) =>
			client((db) =>
				db.insertInto('StudioCMSUsersTable').values(user).returningAll().executeTakeFirstOrThrow()
			),
	});

	/**
	 * Create a new permission rank for a user in the database.
	 */
	const createRank = dbClient.withCodec({
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
	type InsertUser = Parameters<typeof createUser>[0];

	/**
	 * Type for a permission rank to be inserted into the database.
	 */
	type InsertPermission = Parameters<typeof createRank>[0];

	/**
	 * Current DB users.
	 */
	const currentUsers = yield* getCurrentUsers();

	// Collect input data
	const inputData = yield* group(
		{
			username: async () =>
				await runEffect(
					text({
						message: 'Username',
						placeholder: 'johndoe',
						validate: (user) => {
							const u = user.trim();
							const isUser = currentUsers.find(({ username }) => username === u);
							if (isUser) return 'Username is already in use, please try another one';
							// Doing this because we can't use `await` here
							// @effect-diagnostics-next-line runEffectInsideEffect:off
							if (Effect.runSync(checker.username(user))) {
								return 'Username should not be a commonly used unsafe username (admin, root, etc.)';
							}
							return undefined;
						},
					})
				),
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
			newPassword: async () =>
				await runEffect(
					password({
						message: 'Password',
						validate: (password) => {
							// Doing this because we can't use `await` here
							// @effect-diagnostics-next-line runEffectInsideEffect:off
							const passCheck = Effect.runSync(verifyPasswordStrength(password));
							if (passCheck !== true) {
								return passCheck;
							}
							return undefined;
						},
					})
				),
			confirmPassword: async () =>
				await runEffect(
					password({
						message: 'Confirm Password',
					})
				),
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
			catch: (cause) => new Error('Failed to fetch avatar URL', { cause }),
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
	const todo = Effect.all([createUser(newUser), createRank(newRank)]);

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
