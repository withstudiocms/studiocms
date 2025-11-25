import { pathToFileURL } from 'node:url';
import { StudioCMSColorwayBg } from '@withstudiocms/cli-kit/colors';
import { label } from '@withstudiocms/cli-kit/messages';
import { Cli, Effect, runEffect } from '@withstudiocms/effect';
import { intro, log, outro, select, tasks } from '@withstudiocms/effect/clack';
import type { MigrationInfo } from '@withstudiocms/kysely/kysely';
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
				yield* debugLogger('No mode CLI flags provided, Loading interactive...');
				yield* SCMS_Intro(debug).pipe(cliContext);

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
						title: 'Fetched migration status',
						task: async (message) => {
							message('Getting migration status...');

							const status = await runEffect(dbMigrator.status);

							if (status.length === 0) {
								message('No migrations have been applied yet.');
							}

							function createMigrationStatusLine({ name, executedAt }: MigrationInfo): string {
								function cleanName(name: string): string {
									// 20251025T040912_init => init
									const match = name.match(/^\d{8}T\d{6}_(.+)$/);
									return match ? match[1] : name;
								}

								return `- ${cleanName(name)}: ${
									executedAt ? `Applied at ${executedAt.toISOString()}` : 'Pending'
								}\n`;
							}

							const migrations = status.map(createMigrationStatusLine).join('\n');

							await runEffect(log.info(`Migration Status:\n${migrations}`));
						},
					});
					break;
				}
				case MigrationMode.LATEST: {
					context.tasks.push({
						title: 'Migration to latest version',
						task: async (message) => {
							message('Applying latest migrations...');

							const { error, results } = await runEffect(dbMigrator.toLatest);

							results?.forEach(async (it) => {
								if (it.status === 'Success') {
									await runEffect(
										log.success(`Migration "${it.migrationName}" was executed successfully`)
									);
								} else if (it.status === 'Error') {
									await runEffect(log.error(`Failed to execute migration "${it.migrationName}"`));
								}
							});

							if (error) {
								const errorMessage = `Failed to migrate: ${String(error)}`;
								await runEffect(log.error(errorMessage));
								return await runEffect(context.exit(1));
							}
						},
					});

					break;
				}
				case MigrationMode.ROLLBACK:
					context.tasks.push({
						title: 'Rolled back to last migration',
						task: async (message) => {
							message('Reverting last migration...');

							const { error, results } = await runEffect(dbMigrator.down);

							results?.forEach(async (it) => {
								if (it.status === 'Success') {
									await runEffect(
										log.success(`Migration "${it.migrationName}" was reverted successfully`)
									);
								} else if (it.status === 'Error') {
									await runEffect(log.error(`Failed to revert migration "${it.migrationName}"`));
								}
							});

							if (error) {
								const errorMessage = `Failed to rollback: ${String(error)}`;
								await runEffect(log.error(errorMessage));
								return await runEffect(context.exit(1));
							}
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

			const outroMessage = {
				[MigrationMode.LATEST]: 'Database migrated to latest version!',
				[MigrationMode.ROLLBACK]: 'Last migration rolled back successfully!',
				[MigrationMode.STATUS]: 'Migration status fetched successfully!',
			};
			yield* outro(outroMessage[migrationMode]);

			yield* Effect.all([debugLogger('Interactive CLI completed, exiting...'), context.exit(0)]);
		})
).pipe(Cli.Command.withDescription('Manage database migrations for StudioCMS.'));
