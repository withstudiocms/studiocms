import type { AstroIntegrationLogger } from 'astro';
import { vi } from 'vitest';

export const parentSuiteName = '@withstudiocms/component-registry Tests';
export const sharedTags = [
	'package:@withstudiocms/component-registry',
	'type:unit',
	'scope:withstudiocms',
];

export function createMockLogger() {
	// biome-ignore lint/suspicious/noExplicitAny: this is okay
	const logger: Record<string, any> = {
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
