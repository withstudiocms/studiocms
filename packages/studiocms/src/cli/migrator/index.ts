import { pathToFileURL } from 'node:url';
import { StudioCMSColorwayBg, StudioCMSColorwayInfoBg } from '@withstudiocms/cli-kit/colors';
import { label } from '@withstudiocms/cli-kit/messages';
import { Cli, Effect, runEffect } from '@withstudiocms/effect';
import { intro, log, outro, select, tasks } from '@withstudiocms/effect/clack';
import type { MigrationInfo, MigrationResult } from '@withstudiocms/kysely/kysely';
import { getMigratorLive } from '@withstudiocms/kysely/migrator';
import { getDbDriver, parseDbDialect } from '../../db/index.js';
import { genLogger } from '../../effect.js';
import type { StudioCMSConfig } from '../../schemas/index.js';
import { type BaseContext, CliContext, genContext, parseDebug } from '../utils/context.js';
import { intro as SCMS_Intro } from '../utils/intro.js';
import { buildDebugLogger } from '../utils/logger.js';
import { loadConfig } from './utils/loadConfig.js';

export const debug = Cli.Options.boolean('debug').pipe(
	Cli.Options.optional,
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
		yield* Effect.all([log.error(`No ${itemType} selected, exiting...`), context.exit(1)]);
	}
});

/**
 * Create a formatted migration status line.
 *
 * @param migration - The migration information object.
 * @returns A formatted string representing the migration status.
 */
function createMigrationStatusLine({ name, executedAt }: MigrationInfo): string {
	// Get prefix
	const prefix = executedAt ? '✅' : '⏳';

	// Clean name
	const nameMatcher = name.match(/^\d{8}T\d{6}_(.+)$/);
	const cleanName = nameMatcher ? nameMatcher[1] : name;

	// Get status line
	const status = executedAt ? `Applied ${executedAt.toDateString()}` : 'Pending';

	// Return formatted line
	return `- ${prefix} ${cleanName}: ${status}\n`;
}

const getRootUrl = (context: BaseContext) => Effect.sync(() => pathToFileURL(context.cwd));

const extractDialect = (config: StudioCMSConfig) => Effect.sync(() => config.db.dialect);

/**
 * Handle and log migration or rollback results.
 *
 * @param results - The array of MigrationResult objects.
 * @param success - A boolean indicating if the operation was a migration (true) or rollback (false).
 */
const handleResults = async (results: MigrationResult[] | undefined, success: boolean) => {
	const logMessages = success
		? {
				success: (name: string) => `Migration "${name}" was executed successfully`,
				error: (name: string) => `Failed to execute migration "${name}"`,
			}
		: {
				success: (name: string) => `Migration "${name}" was reverted successfully`,
				error: (name: string) => `Failed to revert migration "${name}"`,
			};

	if (results) {
		for (const it of results) {
			if (it.status === 'Success') {
				await runEffect(log.success(logMessages.success(it.migrationName)));
			} else if (it.status === 'Error') {
				await runEffect(log.error(logMessages.error(it.migrationName)));
			}
		}
	}
};

/**
 * Handle errors during migration or rollback.
 *
 * @param error - The error encountered during the operation.
 * @param success - A boolean indicating if the operation was a migration (true) or rollback (false).
 * @param exitFn - The Effect to execute for exiting the process.
 */
const handleError = async (
	error: unknown,
	success: boolean,
	exitFn: Effect.Effect<undefined, never, never>
) => {
	if (error) {
		const message = success
			? `An error occurred during migration: ${String(error)}`
			: `An error occurred during rollback: ${String(error)}`;
		await runEffect(log.error(message));
		return await runEffect(exitFn);
	}
};

enum MigrationMode {
	LATEST = 'latest',
	ROLLBACK = 'rollback',
	STATUS = 'status',
}

const outroMessage = {
	[MigrationMode.LATEST]: 'Database migrated to latest version!',
	[MigrationMode.ROLLBACK]: 'Last migration rolled back successfully!',
	[MigrationMode.STATUS]: 'Migration status fetched successfully!',
};

export const migratorCMD = Cli.Command.make(
	'migrate',
	{ debug, rollback, latest, status },
	({ debug: rawDebug, rollback: rawRollback, latest: rawLatest, status: rawStatus }) =>
		genLogger('studiocms/cli/migrator')(function* () {
			const [rollback, latest, status, debug, context] = yield* Effect.all([
				rawRollback,
				rawLatest,
				rawStatus,
				parseDebug(rawDebug),
				genContext,
			]);

			const [debugLogger, dbMigrator] = yield* Effect.all([
				buildDebugLogger(debug),
				getRootUrl(context).pipe(
					Effect.flatMap(loadConfig),
					Effect.flatMap(extractDialect),
					Effect.flatMap(parseDbDialect),
					Effect.flatMap(getDbDriver),
					Effect.flatMap(getMigratorLive)
				),
			]);

			const cliContext = CliContext.makeProvide(context);

			yield* Effect.all([
				debugLogger('Starting interactive CLI...'),
				debugLogger(`Options: ${JSON.stringify({ debug, rollback }, null, 2)}`),
				debugLogger(`Context: ${JSON.stringify(context, null, 2)}`),
				intro(
					`${label('StudioCMS Migrator', StudioCMSColorwayBg, context.chalk.black)} - initializing...`
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
				yield* Effect.all([
					debugLogger('No mode CLI flags provided, Loading interactive...'),
					SCMS_Intro(debug).pipe(cliContext),
				]);

				const options = yield* select({
					message: 'Select migration mode:',
					options: [
						{ label: 'Migrate to latest', value: MigrationMode.LATEST },
						{ label: 'Rollback last migration', value: MigrationMode.ROLLBACK },
						{ label: 'View migration status', value: MigrationMode.STATUS },
					],
					initialValue: MigrationMode.LATEST,
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
								await runEffect(log.info('No migrations found.'));
								return;
							}

							const migrations = status.map(createMigrationStatusLine).join('\n');

							const migrationTotal = status.length;
							const appliedMigrations = status.filter((m) => m.executedAt).length;
							const migrationPercent = (appliedMigrations / migrationTotal) * 100;

							// If migrations are 100% applied, color green, if over 50% yellow, else red
							const migrationTotalColor =
								migrationPercent === 100
									? context.chalk.green
									: migrationPercent > 50
										? context.chalk.yellow
										: context.chalk.red;

							const labelParts = [
								label('Migration Status', StudioCMSColorwayInfoBg, context.chalk.black),
								label(
									`(${context.chalk.green(appliedMigrations.toString())}/${migrationTotalColor(migrationTotal.toString())}) Applied`,
									context.chalk.bold,
									context.chalk.black
								),
							];

							const responseMessage = `${labelParts.join(' ')}\n\n${migrations}`;

							await runEffect(log.step(responseMessage));
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

							await handleResults(results, true);
							await handleError(error, true, context.exit(1));
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

							await handleResults(results, false);
							await handleError(error, false, context.exit(1));
						},
					});
					break;
				default:
					return yield* context.exit(0);
			}

			// No tasks? Exit
			yield* exitIfEmpty(context, context.tasks, 'tasks').pipe(
				// Run tasks
				Effect.flatMap(() =>
					Effect.all([
						debugLogger(`Tasks to run: ${context.tasks.length}`),
						debugLogger('Running tasks...'),
						tasks(context.tasks),
					])
				),
				// Outro
				Effect.flatMap(() => outro(outroMessage[migrationMode])),
				// Final log and exit
				Effect.flatMap(() =>
					Effect.all([debugLogger('Interactive CLI completed, exiting...'), context.exit(0)])
				)
			);
		})
).pipe(Cli.Command.withDescription('Manage database migrations for StudioCMS.'));
