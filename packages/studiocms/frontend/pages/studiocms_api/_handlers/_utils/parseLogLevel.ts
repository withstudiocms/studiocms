import type { LoggerLevel } from '@withstudiocms/effect';

/**
 * Utility function to parse a log level string from the configuration and convert it into a LoggerLevel type that can be used by the CMSLogger. If the input log level is not recognized, it defaults to 'silent' to avoid logging.
 *
 * @param level The log level string from the configuration, which can be one of 'All', 'Fatal', 'Error', 'Warning', 'Info', 'Debug', 'Trace', or 'None'.
 * @returns The corresponding LoggerLevel type that can be used by the CMSLogger.
 */
export const parseLogLevel = (
	level: 'All' | 'Fatal' | 'Error' | 'Warning' | 'Info' | 'Debug' | 'Trace' | 'None'
): LoggerLevel => {
	switch (level) {
		case 'Info':
			return 'info';
		case 'Warning':
			return 'warn';
		case 'Error':
			return 'error';
		case 'All':
		case 'Fatal':
		case 'Debug':
		case 'Trace':
			return 'debug';
		case 'None':
			return 'silent';
	}
};
