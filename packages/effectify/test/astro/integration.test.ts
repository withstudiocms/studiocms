/** biome-ignore-all lint/suspicious/noExplicitAny: allowed in tests */
import * as allure from 'allure-js-commons';
import type { HookParameters } from 'astro';
import { Effect, Schema } from 'effect';
import { describe, expect, test, vi } from 'vitest';
import { defineIntegration, EffectifyIntegrationHookError } from '../../src/astro/integration.js';
import { parentSuiteName, sharedTags } from '../test-utils.js';

const localSuiteName = 'Astro Integration Tests';

describe(parentSuiteName, () => {
	test('EffectifyIntegrationHookError - should create error with correct properties', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('EffectifyIntegrationHookError Tests');
		await allure.tags(...sharedTags);

		const testError = new Error('Test cause error');
		const hookError = new EffectifyIntegrationHookError({
			hook: 'astro:config:setup',
			message: 'Failed to setup configuration',
			cause: testError,
		});

		await allure.step('Verify EffectifyIntegrationHookError structure', async (ctx) => {
			await ctx.parameter('Error Tag', hookError._tag);
			await ctx.parameter('Hook Name', hookError.hook);
			await ctx.parameter('Error Message', hookError.message);

			expect(hookError._tag).toBe('IntegrationHookError');
			expect(hookError.hook).toBe('astro:config:setup');
			expect(hookError.message).toBe('Failed to setup configuration');
			expect(hookError.cause).toBe(testError);
		});

		await allure.step('Check EffectifyIntegrationHookError instance', async () => {
			expect(hookError instanceof Error).toBe(true);
		});
	});

	test('EffectifyIntegrationHookError - should work without cause', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('EffectifyIntegrationHookError Tests');
		await allure.tags(...sharedTags);

		const hookError = new EffectifyIntegrationHookError({
			hook: 'integration:options',
			message: 'Invalid options provided',
		});

		await allure.step('Verify error without cause', async (ctx) => {
			await ctx.parameter('Has Cause', String(hookError.cause !== undefined));

			expect(hookError.hook).toBe('integration:options');
			expect(hookError.message).toBe('Invalid options provided');
			expect(hookError.cause).toBeUndefined();
		});
	});

	test('defineIntegration - should create integration without schema', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('defineIntegration Tests');
		await allure.tags(...sharedTags);

		const integrationFactory = defineIntegration({
			name: 'test-integration',
			setup: () => ({
				'astro:config:setup': () => Effect.void,
			}),
		});

		await allure.step('Create integration instance', async (ctx) => {
			const integration = integrationFactory();

			await ctx.parameter('Integration Name', integration.name);
			await ctx.parameter('Has Hooks', String(!!integration.hooks));

			expect(integration.name).toBe('test-integration');
			expect(integration.hooks).toBeDefined();
			expect(typeof integration.hooks['astro:config:setup']).toBe('function');
		});
	});

	test('defineIntegration - should create integration with valid schema and options', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('defineIntegration Tests');
		await allure.tags(...sharedTags);

		const OptionsSchema = Schema.Struct({
			enabled: Schema.Boolean,
			apiKey: Schema.String,
		});

		let capturedOptions: any;

		const integrationFactory = defineIntegration({
			name: 'test-integration-with-schema',
			schema: OptionsSchema,
			setup: ({ options }) => {
				capturedOptions = options;
				return {
					'astro:config:setup': () => Effect.void,
				};
			},
		});

		await allure.step('Create integration with valid options', async (ctx) => {
			const integration = integrationFactory({
				enabled: true,
				apiKey: 'test-key-123',
			});

			await ctx.parameter('Integration Name', integration.name);
			await ctx.parameter('Captured Options', JSON.stringify(capturedOptions));

			expect(integration.name).toBe('test-integration-with-schema');
			expect(capturedOptions).toEqual({
				enabled: true,
				apiKey: 'test-key-123',
			});
		});
	});

	test('defineIntegration - should throw error with invalid schema options', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('defineIntegration Tests');
		await allure.tags(...sharedTags);

		const OptionsSchema = Schema.Struct({
			enabled: Schema.Boolean,
			count: Schema.Number,
		});

		const integrationFactory = defineIntegration({
			name: 'test-integration-invalid',
			schema: OptionsSchema,
			setup: () => ({
				'astro:config:setup': () => Effect.void,
			}),
		});

		await allure.step('Attempt to create integration with invalid options', async (ctx) => {
			await ctx.parameter(
				'Invalid Options',
				JSON.stringify({ enabled: 'not-a-boolean', count: 'not-a-number' })
			);

			expect(() => {
				integrationFactory({
					enabled: 'not-a-boolean' as any,
					count: 'not-a-number' as any,
				});
			}).toThrow(EffectifyIntegrationHookError);

			try {
				integrationFactory({
					enabled: 'not-a-boolean' as any,
					count: 'not-a-number' as any,
				});
			} catch (error) {
				expect(error).toBeInstanceOf(EffectifyIntegrationHookError);
				if (error instanceof EffectifyIntegrationHookError) {
					expect(error.hook).toBe('integration:options');
					expect(error.message).toContain('Invalid options provided');
					expect(error.message).toContain('test-integration-invalid');
				}
			}
		});
	});

	test('defineIntegration - should execute hooks successfully', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('defineIntegration Hook Execution');
		await allure.tags(...sharedTags);

		const mockSetupFn = vi.fn();

		const integrationFactory = defineIntegration({
			name: 'test-hook-execution',
			setup: () => ({
				'astro:config:setup': (params) =>
					Effect.sync(() => {
						mockSetupFn(params);
					}),
			}),
		});

		const integration = integrationFactory();

		await allure.step('Execute astro:config:setup hook', async (ctx) => {
			const mockParams = {
				config: {},
				command: 'dev' as const,
				isRestart: false,
				updateConfig: vi.fn(),
				addRenderer: vi.fn(),
				addWatchFile: vi.fn(),
				injectScript: vi.fn(),
				injectRoute: vi.fn(),
				addMiddleware: vi.fn(),
				logger: {} as any,
			} as unknown as HookParameters<'astro:config:setup'>;

			await integration.hooks['astro:config:setup']?.(mockParams);

			await ctx.parameter('Mock Setup Called', String(mockSetupFn.mock.calls.length));

			expect(mockSetupFn).toHaveBeenCalledTimes(1);
			expect(mockSetupFn).toHaveBeenCalledWith(mockParams);
		});
	});

	test('defineIntegration - should handle Effect errors in hooks', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('defineIntegration Error Handling');
		await allure.tags(...sharedTags);

		const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

		const testError = new EffectifyIntegrationHookError({
			hook: 'astro:config:setup',
			message: 'Hook execution failed',
		});

		const integrationFactory = defineIntegration({
			name: 'test-hook-error',
			setup: () => ({
				'astro:config:setup': () => Effect.fail(testError),
			}),
		});

		const integration = integrationFactory();

		try {
			await allure.step('Execute hook that throws error', async (ctx) => {
				const mockParams = {
					config: {},
					command: 'dev' as const,
				} as HookParameters<'astro:config:setup'>;

				await ctx.parameter('Test Error Message', testError.message);

				await expect(integration.hooks['astro:config:setup']?.(mockParams)).rejects.toThrow();

				try {
					await integration.hooks['astro:config:setup']?.(mockParams);
				} catch (error) {
					expect(consoleErrorSpy).toHaveBeenCalled();
				}
			});
		} finally {
			consoleErrorSpy.mockRestore();
		}
	});

	test('defineIntegration - should handle EffectifyIntegrationHookError in hooks', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('defineIntegration Error Handling');
		await allure.tags(...sharedTags);

		const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

		const hookError = new EffectifyIntegrationHookError({
			hook: 'astro:config:setup',
			message: 'Custom hook error',
		});

		const integrationFactory = defineIntegration({
			name: 'test-hook-custom-error',
			setup: () => ({
				'astro:config:setup': () => Effect.fail(hookError),
			}),
		});

		const integration = integrationFactory();

		try {
			await allure.step('Execute hook that throws EffectifyIntegrationHookError', async (ctx) => {
				const mockParams = {
					config: {},
					command: 'dev' as const,
				} as HookParameters<'astro:config:setup'>;

				await ctx.parameter('Hook Error Type', hookError._tag);

				await expect(integration.hooks['astro:config:setup']?.(mockParams)).rejects.toThrow(
					EffectifyIntegrationHookError
				);

				try {
					await integration.hooks['astro:config:setup']?.(mockParams);
				} catch (error) {
					expect(error).toBeInstanceOf(EffectifyIntegrationHookError);
					if (error instanceof EffectifyIntegrationHookError) {
						expect(error.hook).toBe('astro:config:setup');
						expect(error.message).toContain('test-hook-custom-error');
					}
				}
			});
		} finally {
			consoleErrorSpy.mockRestore();
		}
	});

	test('defineIntegration - should support multiple hooks', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('defineIntegration Multiple Hooks');
		await allure.tags(...sharedTags);

		const mockConfigSetup = vi.fn();
		const mockConfigDone = vi.fn();
		const mockServerSetup = vi.fn();

		const integrationFactory = defineIntegration({
			name: 'test-multiple-hooks',
			setup: () => ({
				'astro:config:setup': (params) =>
					Effect.sync(() => {
						mockConfigSetup(params);
					}),
				'astro:config:done': (params) =>
					Effect.sync(() => {
						mockConfigDone(params);
					}),
				'astro:server:setup': (params) =>
					Effect.sync(() => {
						mockServerSetup(params);
					}),
			}),
		});

		const integration = integrationFactory();

		await allure.step('Verify all hooks are present', async (ctx) => {
			await ctx.parameter(
				'Has astro:config:setup',
				String(!!integration.hooks['astro:config:setup'])
			);
			await ctx.parameter(
				'Has astro:config:done',
				String(!!integration.hooks['astro:config:done'])
			);
			await ctx.parameter(
				'Has astro:server:setup',
				String(!!integration.hooks['astro:server:setup'])
			);

			expect(typeof integration.hooks['astro:config:setup']).toBe('function');
			expect(typeof integration.hooks['astro:config:done']).toBe('function');
			expect(typeof integration.hooks['astro:server:setup']).toBe('function');
		});

		await allure.step('Execute all hooks', async () => {
			await integration.hooks['astro:config:setup']?.({} as any);
			await integration.hooks['astro:config:done']?.({} as any);
			await integration.hooks['astro:server:setup']?.({} as any);

			expect(mockConfigSetup).toHaveBeenCalledTimes(1);
			expect(mockConfigDone).toHaveBeenCalledTimes(1);
			expect(mockServerSetup).toHaveBeenCalledTimes(1);
		});
	});

	test('defineIntegration - should use default empty object for schema when no options provided', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('defineIntegration Default Options');
		await allure.tags(...sharedTags);

		const OptionsSchema = Schema.Struct({
			enabled: Schema.optional(Schema.Boolean),
		});

		let capturedOptions: any;

		const integrationFactory = defineIntegration({
			name: 'test-default-options',
			schema: OptionsSchema,
			setup: ({ options }) => {
				capturedOptions = options;
				return {
					'astro:config:setup': () => Effect.void,
				};
			},
		});

		await allure.step('Create integration without providing options', async (ctx) => {
			const integration = integrationFactory();

			await ctx.parameter('Captured Options', JSON.stringify(capturedOptions));

			expect(integration.name).toBe('test-default-options');
			expect(capturedOptions).toEqual({});
		});
	});
});
