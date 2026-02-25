import type { LoggerLevel } from '@withstudiocms/effect';

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
