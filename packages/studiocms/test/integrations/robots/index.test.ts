/** biome-ignore-all lint/suspicious/noExplicitAny: allowed in tests */

import * as allure from 'allure-js-commons';
import type { AstroIntegration } from 'astro';
import { describe, expect, expectTypeOf, test } from 'vitest';
import robotsTXT from '../../../src/integrations/robots/index';
import { parentSuiteName, sharedTags } from '../../test-utils';

const localSuiteName = 'Robots Integration';

describe(parentSuiteName, () => {
	test('robotsTXT integration returns correct definition', async () => {
		const tags = [...sharedTags, 'integration:robots', 'robots:integration'];

		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('robotsTXT integration definition test');
		await allure.tags(...tags);

		await allure.step('Instantiate robotsTXT integration', () => {
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
