/** biome-ignore-all lint/suspicious/noExplicitAny: allowed in tests */

import type { AstroIntegration } from 'astro';
import { describe, expect, expectTypeOf } from 'vitest';
import robotsTXT from '../../../src/integrations/robots/index';
import { allureTester } from '../../fixtures/allureTester';
import { parentSuiteName, sharedTags } from '../../test-utils';

const localSuiteName = 'Robots Integration';

describe(parentSuiteName, () => {
	const test = allureTester({
		suiteName: localSuiteName,
		suiteParentName: parentSuiteName,
	});

	test('robotsTXT integration returns correct definition', async ({ setupAllure, step }) => {
		const tags = [...sharedTags, 'integration:robots', 'robots:integration'];

		await setupAllure({
			subSuiteName: 'robotsTXT integration definition test',
			tags: [...tags],
		});

		await step('Instantiate robotsTXT integration', () => {
			const integration = robotsTXT({});
			expect(integration).toBeDefined();
			expect(integration.name).toBe('studiocms/robotstxt');
			expect(typeof integration.hooks['astro:config:setup']).toBe('function');
			expect(typeof integration.hooks['astro:build:start']).toBe('function');
			expect(typeof integration.hooks['astro:build:done']).toBe('function');
			expectTypeOf(integration).toEqualTypeOf<AstroIntegration>();
		});
	});
});
