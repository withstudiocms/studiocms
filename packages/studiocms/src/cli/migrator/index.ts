import { pathToFileURL } from 'node:url';
import { StudioCMSColorwayBg } from '@withstudiocms/cli-kit/colors';
import { label } from '@withstudiocms/cli-kit/messages';
import { Cli, Effect, runEffect } from '@withstudiocms/effect';
import { intro, log, outro, select, tasks } from '@withstudiocms/effect/clack';
import { getMigratorLive } from '@withstudiocms/kysely/migrator';
import { getDbDriver, parseDbDialect } from '../../db/index.js';
import { genLogger } from '../../effect.js';
import { type BaseContext, CliContext, genContext, parseDebug } from '../utils/context.js';
import { intro as SCMS_Intro } from '../utils/intro.js';
import { buildDebugLogger } from '../utils/logger.js';
import { loadConfig } from './utils/loadConfig.js';

export const debug = Cli.Options.boolean('debug').pipe(
	Cli.Options.optional,
	Cli.Options.withDefault(false),
	Cli.Options.withDescription('Enable debug mode')
);

export const rollback = Cli.Options.boolean('rollback').pipe(
	Cli.Options.optional,
	Cli.Options.withAlias('r'),
	Cli.Options.withDescription('Rollback the last migration')
);

export const latest = Cli.Options.boolean('latest').pipe(
	Cli.Options.optional,
	Cli.Options.withAlias('l'),
	Cli.Options.withDescription('Migrate to the latest version')
);

export const status = Cli.Options.boolean('status').pipe(
	Cli.Options.optional,
	Cli.Options.withDescription('Show the current migration status')
);

// biome-ignore lint/suspicious/noExplicitAny: this is a valid use case for explicit any
const exitIfEmpty = Effect.fn(function* (context: BaseContext, items: any[], itemType: string) {
	if (items.length === 0) {
		yield* log.error(`No ${itemType} selected, exiting...`);
		yield* context.exit(0);
	}
});

enum MigrationMode {
	LATEST = 'latest',
	ROLLBACK = 'rollback',
	STATUS = 'status',
}

export type MigrationStepFn = (
	context: BaseContext,
	debug: boolean,
	rollback: boolean
) => Effect.Effect<void, Error>;

export const migratorCMD = Cli.Command.make(
	'migrate',
	{ debug, rollback, latest, status },
	({ debug: rawDebug, rollback: rawRollback, latest: rawLatest, status: rawStatus }) =>
		genLogger('studiocms/cli/migrator')(function* () {
			const [rollback, context, debug, latest, status] = yield* Effect.all([
				rawRollback,
				genContext,
				parseDebug(rawDebug),
				rawLatest,
				rawStatus,
			]);

			const debugLogger = yield* buildDebugLogger(debug);

			const cliContext = CliContext.makeProvide(context);

			// Load StudioCMS Configuration
			const [__drop, studiocmsConfig] = yield* Effect.all([
				debugLogger('Loading StudioCMS configuration...'),
				loadConfig(pathToFileURL(context.cwd)),
			]);

			// Initialize DB Migrator
			const [_dbMigratorLog, dbMigrator] = yield* Effect.all([
				debugLogger('Getting database migrator...'),
				parseDbDialect(studiocmsConfig.db.dialect).pipe(
					Effect.flatMap(getDbDriver),
					Effect.flatMap(getMigratorLive)
				),
			]);

			yield* Effect.all([
				debugLogger('Starting interactive CLI...'),
				debugLogger(
					`Options: ${JSON.stringify({ debug, rollback, dialect: studiocmsConfig.db.dialect }, null, 2)}`
				),
				debugLogger(`Context: ${JSON.stringify(context, null, 2)}`),
				intro(
					`${label('StudioCMS', StudioCMSColorwayBg, context.chalk.black)} Interactive CLI - initializing...`
				),
			]);

			yield* SCMS_Intro(debug).pipe(cliContext);

			const isRollback = rollback && !latest && !status;
			const isLatest = !rollback && latest && !status;
			const isStatus = !rollback && !latest && status;

			// Determine migration mode

			let migrationMode = isRollback
				? MigrationMode.ROLLBACK
				: isLatest
					? MigrationMode.LATEST
					: isStatus
						? MigrationMode.STATUS
						: null;

			if (!migrationMode) {
				yield* debugLogger('No mode CLI flags provided, prompting user for selection...');
				const options = yield* select({
					message: 'Select migration mode:',
					options: [
						{ label: 'Migrate to latest', value: MigrationMode.LATEST },
						{ label: 'Rollback last migration', value: MigrationMode.ROLLBACK },
						{ label: 'View migration status', value: MigrationMode.STATUS },
					],
					initialValue: rollback ? MigrationMode.ROLLBACK : MigrationMode.LATEST,
				});

				// Cancel or add steps based on options
				if (typeof options === 'symbol') {
					return yield* context.pCancel(options);
				}

				migrationMode = options;
			}

			switch (migrationMode) {
				case MigrationMode.STATUS: {
					context.tasks.push({
						title: 'Fetching migration status',
						task: async (message) => {
							message('Getting migration status...');

							const status = await runEffect(dbMigrator.status);

							if (status.length === 0) {
								message('No migrations have been applied yet.');
							}

							const migrations = status
								.map((migration) => {
									const applied = migration.executedAt
										? `Applied at ${migration.executedAt.toISOString()}`
										: 'Pending';
									return `- ${migration.name}: ${applied}`;
								})
								.join('\n');

							await runEffect(outro(`Migration Status:\n\n${migrations}`));
						},
					});

					break;
				}
				case MigrationMode.LATEST: {
					context.tasks.push({
						title: 'Migrating to latest version',
						task: async (message) => {
							message('Applying latest migrations...');

							const { error, results } = await runEffect(dbMigrator.toLatest);

							results?.forEach(async (it) => {
								if (it.status === 'Success') {
									message(`Migration "${it.migrationName}" was executed successfully`);
								} else if (it.status === 'Error') {
									message(`Failed to execute migration "${it.migrationName}"`);
								}
							});

							if (error) {
								const errorMessage = `Failed to migrate: ${String(error)}`;
								message(errorMessage);
								return await runEffect(context.exit(1));
							}

							await runEffect(outro('Database migrated to latest version!'));
						},
					});
					break;
				}
				case MigrationMode.ROLLBACK:
					context.tasks.push({
						title: 'Rolling back last migration',
						task: async (message) => {
							message('Reverting last migration...');

							const { error, results } = await runEffect(dbMigrator.down);

							results?.forEach(async (it) => {
								if (it.status === 'Success') {
									message(`Migration "${it.migrationName}" was reverted successfully`);
								} else if (it.status === 'Error') {
									message(`Failed to revert migration "${it.migrationName}"`);
								}
							});

							if (error) {
								const errorMessage = `Failed to rollback: ${String(error)}`;
								message(errorMessage);
								return await runEffect(context.exit(1));
							}

							await runEffect(outro('Last migration rolled back successfully!'));
						},
					});
					break;
				default:
					return yield* context.exit(0);
			}

			// No tasks? Exit
			yield* exitIfEmpty(context, context.tasks, 'tasks');

			yield* Effect.all([
				debugLogger(`Tasks to run: ${context.tasks.length}`),
				debugLogger('Running tasks...'),
				tasks(context.tasks),
			]);

			yield* Effect.all([debugLogger('Interactive CLI completed, exiting...'), context.exit(0)]);
		})
).pipe(Cli.Command.withDescription('Manage database migrations for StudioCMS.'));
