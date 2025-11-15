import * as allure from 'allure-js-commons';
import {
	experimental_AstroContainer as AstroContainer,
	type AstroContainerOptions,
	type ContainerRenderOptions,
} from 'astro/container';
import type { AstroComponentFactory } from 'astro/runtime/server/index.js';
import { test as baseTest } from 'vitest';
import { cleanAstroAttributes, MockAstroLocals } from '../test-utils';

// TODO: Implement new allureTester for tests for both component rendering and allure setup

/**
 * Creates a test fixture extension that augments `baseTest` with utilities for rendering
 * Astro components and configuring Allure test reporting.
 *
 * @param allureMeta - Metadata used to initialize Allure suite context for each test that uses the fixture.
 * @param allureMeta.suiteParentName - The parent suite name to set on the Allure report.
 * @param allureMeta.suiteName - The suite name to set on the Allure report.
 *
 * @remarks
 * The produced fixture adds the following properties to tests:
 * - `astroContainerOptions?: AstroContainerOptions` — optional configuration used when creating an `AstroContainer`.
 * - `renderComponent` — an async helper that:
 *     - accepts an `AstroComponentFactory`, a component `name`, and optional render options (excluding `locals`),
 *     - creates an `AstroContainer` using `astroContainerOptions`,
 *     - renders the component to a string with mocked Astro locals,
 *     - returns the rendered HTML with Astro-specific attributes cleaned/normalized for deterministic testing.
 * - `setupAllure` — an async helper to configure Allure context for the current test. It accepts:
 *     - `subSuiteName` to set a sub-suite on Allure,
 *     - `tags` to attach to the test,
 *     - optional `parameters` (a record of key/value strings) to add to the Allure entry,
 *     - optional `description` to annotate the test.
 *
 * Use this fixture when you need deterministic server-side rendering of Astro components in tests
 * and structured Allure metadata (suite/sub-suite/tags/parameters/description) for reporting.
 *
 * @returns A `baseTest` extension exposing the described fixtures for use in tests.
 */
export const allureTester = (allureMeta: { suiteParentName: string; suiteName: string }) =>
	baseTest.extend<{
		astroContainerOptions?: AstroContainerOptions;
		renderComponent: (
			component: AstroComponentFactory,
			name: string,
			opts?: Omit<ContainerRenderOptions, 'locals'>
		) => Promise<string>;
		setupAllure: (opts: {
			subSuiteName: string;
			tags: string[];
			parameters?: Record<string, string>;
			description?: string;
		}) => Promise<void>;
		step: typeof allure.step;
	}>({
		/**
		 * AstroContainer-based component renderer.
		 *
		 * @param component - The Astro component to render.
		 * @param name - The name of the component, used for logging.
		 * @param opts - Additional rendering options excluding locals.
		 *
		 * @remarks
		 * This fixture creates an `AstroContainer` using the provided options
		 * and exposes a function to render Astro components to string with mocked locals.
		 * The rendered output is cleaned of Astro-specific attributes for testing purposes.
		 */
		renderComponent: async ({ astroContainerOptions }, use) =>
			await use(async (component, name, opts) => {
				// Create the AstroContainer with provided options
				const container = await AstroContainer.create(astroContainerOptions);

				// Render the component to string with mocked locals
				const raw = await container.renderToString(component, {
					...opts,
					locals: MockAstroLocals(),
				});

				// Clean Astro-specific attributes from the output
				return cleanAstroAttributes(raw, `/mock/path/${name}.astro`);
			}),

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
