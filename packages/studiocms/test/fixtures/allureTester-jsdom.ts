import * as allure from 'allure-js-commons';
import { test as baseTest } from 'vitest';

/**
 * Extends the base test fixture with Allure helpers tailored for jsdom-based tests.
 *
 * @param allureMeta - Metadata used to initialize the Allure reporting context.
 * @param allureMeta.suiteParentName - The parent suite name applied to every test configured with this fixture.
 * @param allureMeta.suiteName - The suite name applied to every test configured with this fixture.
 *
 * @returns An object of test fixtures that includes:
 *  - setupAllure: async function to configure Allure context for an individual test.
 *  - step: a direct proxy to Allure's `step` function for creating nested steps.
 *
 * setupAllure(opts):
 * @param opts.subSuiteName - The sub-suite name to assign to the current test within the configured suite.
 * @param opts.tags - An array of tags to associate with the test (spread onto Allure).
 * @param opts.parameters - Optional key/value mapping of parameters to attach to the test in Allure.
 * @param opts.description - Optional textual description for the test in Allure.
 *
 * @remarks
 * Calling `setupAllure` will set the Allure parent suite and suite using the provided `allureMeta`,
 * then set the provided sub-suite name and attach the supplied tags. If a description is provided,
 * it will be set on the Allure test; any provided parameters will be added as Allure parameters.
 *
 * The exported `step` fixture is a convenience proxy to `allure.step`, enabling creation of
 * nested steps directly from tests while preserving typing.
 *
 * @example
 * // Usage in a test
 * await setupAllure({
 *   subSuiteName: 'MyComponent',
 *   tags: ['e2e', 'critical'],
 *   parameters: { browser: 'jsdom' },
 *   description: 'Verifies core behavior of MyComponent'
 * });
 *
 * await step('perform action', async () => {
 *   // test actions and assertions
 * });
 */
export const allureTesterJsDom = (allureMeta: { suiteParentName: string; suiteName: string }) =>
	baseTest.extend<{
		setupAllure: (opts: {
			subSuiteName: string;
			tags: string[];
			parameters?: Record<string, string>;
			description?: string;
		}) => Promise<void>;
		step: typeof allure.step;
	}>({
		/**
		 * Sets up Allure reporting context for a test.
		 *
		 * @param opts - Options for configuring the Allure context.
		 * @param opts.subSuiteName - The name of the sub-suite.
		 * @param opts.tags - An array of tags to associate with the test.
		 * @param opts.parameters - Optional parameters to log in Allure.
		 * @param opts.description - Optional description for the test.
		 *
		 * @remarks
		 * This fixture configures the Allure reporting context by setting
		 * the parent suite, suite, and sub-suite names, along with any tags
		 * and parameters provided. This helps in organizing and categorizing
		 * test results in Allure reports.
		 */
		setupAllure: async ({ _local }, use) => {
			await use(async ({ subSuiteName, tags, parameters, description }) => {
				// Configure Allure context for the test
				await allure.parentSuite(allureMeta.suiteParentName);
				await allure.suite(allureMeta.suiteName);
				await allure.subSuite(subSuiteName);
				await allure.tags(...tags);

				// Add optional description and parameters
				if (description) {
					await allure.description(description);
				}
				if (parameters) {
					for (const [key, value] of Object.entries(parameters)) {
						await allure.parameter(key, value);
					}
				}
			});
		},

		/**
		 * Proxy to Allure's step function for use in tests.
		 *
		 * @remarks
		 * This fixture exposes Allure's step function directly,
		 * allowing tests to create nested steps in the Allure report.
		 */
		step: async ({ _local }, use) => await use(allure.step),
	});
