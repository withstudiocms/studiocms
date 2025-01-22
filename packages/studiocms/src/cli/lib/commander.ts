import {
	type CommandUnknownOpts,
	type OutputConfiguration,
	Command as _Command,
	Help as _Help,
} from '@commander-js/extra-typings';
import { type ChalkInstance, chalkStderr as chalkStdErr, default as chalkStdOut } from 'chalk';
import stripAnsi from 'strip-ansi';
import wrapAnsi from 'wrap-ansi';
import { StudioCMSColorwayError, date, supportsColor } from './utils.js';

export class Help extends _Help {
	chalk: ChalkInstance;
	colorway: ChalkInstance;
	colorwayError: ChalkInstance = StudioCMSColorwayError;
	sortOptions = true;
	sortSubcommands = true;
	showGlobalOptions = true;
	subcommandTerm = (cmd: CommandUnknownOpts) =>
		cmd.name() === 'interactive'
			? `${this.colorway(cmd.name())}${this.colorwayError('*')}`
			: this.colorway(cmd.name());
	subcommandDescription = (cmd: CommandUnknownOpts) => {
		const desc = cmd.summary() || cmd.description();
		return desc;
	};

	constructor() {
		super();
		this.chalk = chalkStdOut;
		this.colorway = this.chalk.hex('#a581f3');
	}

	prepareContext(contextOptions: {
		error?: boolean;
		helpWidth?: number;
		outputHasColors?: boolean;
	}) {
		super.prepareContext(contextOptions);
		if (contextOptions?.error) {
			this.chalk = chalkStdErr;
		}
	}

	displayWidth(str: string) {
		return stripAnsi(str).length; // use imported package
	}

	boxWrap(str: string, width: number) {
		return wrapAnsi(str, width, { hard: true }); // use imported package
	}

	styleTitle(str: string) {
		return this.chalk.bold(str);
	}
	styleCommandText(str: string) {
		return this.chalk.cyan(str);
	}
	styleCommandDescription(str: string) {
		return this.chalk.magenta(str);
	}
	styleDescriptionText(str: string) {
		return this.chalk.italic(str);
	}
	styleOptionText(str: string) {
		return this.chalk.green(str);
	}
	styleArgumentText(str: string) {
		return this.chalk.yellow(str);
	}
	styleSubcommandText(str: string) {
		return str;
	}
}

export class Command extends _Command {
	chalk: ChalkInstance = chalkStdOut;
	colorwayError = StudioCMSColorwayError;
	supportsColor = supportsColor;
	max = process.stdout.columns;
	prefix = this.max < 80 ? ' ' : ' '.repeat(2);

	_outputConfiguration: OutputConfiguration | undefined = {
		writeOut: (str) => process.stdout.write(str),
		writeErr: (str) => process.stdout.write(`ERROR [${date}]: ${str}`),
		// Output errors in red.
		outputError: (str, write) =>
			write(`${this.chalk.red.bold(`ERROR [${date}]:`)} ${this.chalk.red(str)}`),
		getOutHelpWidth: () => (process.stdout.isTTY ? (process.stdout.columns ?? 80) : 80),
		getErrHelpWidth: () => (process.stderr.isTTY ? (process.stderr.columns ?? 80) : 80),
		getOutHasColors: () => this.supportsColor,
		getErrHasColors: () => this.supportsColor,
		stripColor: (str) => stripAnsi(str),
	};

	createCommand(name: string | undefined) {
		return new Command(name);
	}

	createHelp() {
		return Object.assign(new Help(), this.configureHelp());
	}
}

export type newInstanceCommand = InstanceType<typeof Command>;

export type instanceCommand = InstanceType<typeof _Command>;
