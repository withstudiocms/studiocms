import type { AstroIntegrationLogger } from 'astro';
import { vi } from 'vitest';

export const parentSuiteName = '@withstudiocms/internal_helpers Package Tests';
export const sharedTags = [
	'package:@withstudiocms/internal_helpers',
	'type:unit',
	'scope:withstudiocms',
];

// Example changelog markdown for testing
export const mockMarkdown = `
# @withstudiocms/config-utils

## 0.1.0-beta.3

### Patch Changes

- [#685](https://github.com/withstudiocms/studiocms/pull/685) [\`169c9be\`](https://github.com/withstudiocms/studiocms/commit/169c9be7649bbd9522c6ab68a9aeca4ebfc2b86d) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Add tests to ensure functionality of main utils

## 0.1.0-beta.2

### Patch Changes

- [#666](https://github.com/withstudiocms/studiocms/pull/666) [\`0b1574b\`](https://github.com/withstudiocms/studiocms/commit/0b1574bfe32ef98dc62ed9082a132a540f0ad4ba) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Tweak watch config utility to be a builder akin to the configresolver util

## 0.1.0-beta.1

### Patch Changes

- [#657](https://github.com/withstudiocms/studiocms/pull/657) [\`a05bb16\`](https://github.com/withstudiocms/studiocms/commit/a05bb16d3dd0d1a429558b4dce316ad7fb80b049) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Migrate to using new config utils package that contains generic config helpers instead of relying on specific ones built-in to studiocms

`;

export const markdownIncludesURL = 'https://github.com/Adammatthiesen';
export const markdownParsedUsername = '@Adammatthiesen';

export interface LogWritable<T> {
	write: (chunk: T) => boolean;
}
export type LoggerLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';
export interface LogMessage {
	label: string | null;
	level: LoggerLevel;
	message: string;
	newLine: boolean;
}

const loggerDest: LogWritable<LogMessage> = {
	write: (_chunk: LogMessage) => {
		// Mock implementation: simply return true
		return true;
	},
};

export const loggerOptions = {
	level: 'info' as const,
	dest: loggerDest,
};

export function createMockLogger() {
	const logger: AstroIntegrationLogger = {
		label: '',
		options: loggerOptions,
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
		debug: vi.fn(),
		fork: vi.fn((label: string) => {
			// Each fork returns a new mock logger with the label attached for testing
			const forked = createMockLogger();
			forked.label = label;
			return forked;
		}),
	};
	return logger as unknown as AstroIntegrationLogger;
}
