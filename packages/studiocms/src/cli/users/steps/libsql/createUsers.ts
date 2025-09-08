import { getAvatarUrl } from '@withstudiocms/auth-kit/utils/libravatar';
import { StudioCMSColorwayInfo } from '@withstudiocms/cli-kit/colors';
import { group, log, password, select, text } from '@withstudiocms/effect/clack';
import { z } from 'astro/zod';
import { Effect, runEffect } from '../../../../effect.js';
import { buildDebugLogger } from '../../../utils/logger.js';
import type { EffectStepFn } from '../../../utils/types.js';
import { libSQLDrizzleClient, Permissions, Users } from '../../../utils/useLibSQLDb.js';
import { getCheckers, hashPassword, verifyPasswordStrength } from '../../../utils/user-utils.js';

export const libsqlCreateUsers: EffectStepFn = Effect.fn(function* (context, debug, dryRun) {
	const [checker, debugLogger] = yield* Effect.all([getCheckers, buildDebugLogger(debug)]);

	const { ASTRO_DB_REMOTE_URL, ASTRO_DB_APP_TOKEN } = process.env;

	const [_drop, db] = yield* Effect.all([
		debugLogger('Running libsqlUsers...'),
		libSQLDrizzleClient(ASTRO_DB_REMOTE_URL as string, ASTRO_DB_APP_TOKEN as string),
	]);

	const currentUsers = yield* db.execute((db) => db.select().from(Users));

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

	const { confirmPassword, email, name, newPassword, rank, username } = inputData;

	if (newPassword !== confirmPassword) {
		yield* log.error(context.chalk.red('Passwords do not match, exiting...'));
		return yield* context.exit(1);
	}

	const newUserId = crypto.randomUUID();

	const [hashedPassword, avatar] = yield* Effect.all([
		hashPassword(newPassword),
		Effect.tryPromise({
			try: () => getAvatarUrl({ email, https: true, size: 400, default: 'retro' }),
			catch: (cause) => new Error('Failed to fetch avatar URL', { cause }),
		}),
	]);

	const newUser: typeof Users.$inferInsert = {
		id: newUserId,
		name,
		username,
		email,
		avatar,
		password: hashedPassword,
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	const newRank: typeof Permissions.$inferInsert = {
		user: newUserId,
		rank,
	};

	if (dryRun) {
		context.tasks.push({
			title: `${StudioCMSColorwayInfo.bold('--dry-run')} ${context.chalk.dim('Skipping user creation')}`,
			task: async (message) => {
				message('Creating user... (skipped)');
			},
		});
	} else {
		context.tasks.push({
			title: context.chalk.dim('Creating user...'),
			task: async (message) => {
				try {
					const [insertedUser, insertedRank] = await runEffect(
						db.execute((tx) =>
							tx.batch([
								tx.insert(Users).values(newUser).returning(),
								tx.insert(Permissions).values(newRank).returning(),
							])
						)
					);

					if (insertedUser.length === 0 || insertedRank.length === 0) {
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
