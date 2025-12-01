import { styleText } from 'node:util';

const dateTimeFormat = new Intl.DateTimeFormat([], {
	hour: '2-digit',
	minute: '2-digit',
	second: '2-digit',
	hour12: false,
});

function getLevelPrefix(level) {
	const levelLabel = level.toUpperCase();
	switch (level) {
		case 'error':
			return `[${levelLabel}]`;
		case 'warn':
			return `[${levelLabel}]`;
		case 'debug':
			return `[${levelLabel}]`;
		default:
			return '';
	}
}

export const getEventPrefix = (level, label) => {
	const timestamp = `${dateTimeFormat.format(/* @__PURE__ */ new Date())}`;
	const prefix = [];
	if (level === 'error' || level === 'warn' || level === 'debug') {
		prefix.push(styleText('bold', timestamp));
		prefix.push(getLevelPrefix(level));
	} else {
		prefix.push(timestamp);
	}
	if (label) {
		prefix.push(`[${label}]`);
	}
	if (level === 'error') {
		return styleText('red', prefix.join(' '));
	}
	if (level === 'warn') {
		return styleText('yellow', prefix.join(' '));
	}
	if (level === 'debug') {
		return styleText('blue', prefix.join(' '));
	}
	if (prefix.length === 1) {
		/* v8 ignore start */
		return styleText('dim', prefix[0]);
		/* v8 ignore stop */
	}
	return `${styleText('dim', prefix[0])} ${styleText('blue', prefix.splice(1).join(' '))}`;
};

export class Logger {
	options;
	label;

	constructor(logging, label) {
		this.options = logging;
		this.label = label;
	}

	/**
	 * Creates a new logger instance with a new label, but the same log options.
	 */
	fork(label) {
		return new Logger(this.options, label);
	}

	info(message) {
		console.log(`${getEventPrefix('info', this.label)} ${message}`);
	}
	warn(message) {
		console.warn(`${getEventPrefix('warn', this.label)} ${message}`);
	}
	error(message) {
		console.error(`${getEventPrefix('error', this.label)} ${message}`);
	}
	debug(message) {
		console.debug(`${getEventPrefix('debug', this.label)} ${message}`);
	}
}
