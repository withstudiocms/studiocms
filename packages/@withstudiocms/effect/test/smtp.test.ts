import * as allure from 'allure-js-commons';
import type { Layer } from 'effect/Layer';
import nodemailer from 'nodemailer';
import { beforeAll, describe, expect, it, test } from 'vitest';
import { Effect } from '../src/effect.js';
import { SMTPService, SMTPTransportConfig, TransportConfig } from '../src/smtp.js';
import { parentSuiteName, sharedTags } from './test-utils.js';

const localSuiteName = 'SMTP Service Tests';

describe(parentSuiteName, { timeout: 10000 }, () => {
	let testAccount: Awaited<ReturnType<typeof nodemailer.createTestAccount>>;
	let testConfig: TransportConfig;
	let testLayer: Layer<SMTPTransportConfig, never, never>;

	beforeAll(async () => {
		testAccount = await nodemailer.createTestAccount();

		testConfig = TransportConfig({
			transport: {
				host: testAccount.smtp.host,
				port: testAccount.smtp.port,
				secure: testAccount.smtp.secure,
				auth: {
					user: testAccount.user,
					pass: testAccount.pass,
				},
			},
		});

		testLayer = SMTPTransportConfig.makeLive(testConfig);
	});

	test(`${localSuiteName} - SMTPTransportConfig Should Create Live Layer`, async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('SMTPTransportConfig Tests');
		await allure.tags(...sharedTags);

		await allure.step('Create live layer with test configuration', async (ctx) => {
			const configArgs = {
				transport: {
					host: 'smtp.example.com',
					port: 587,
					secure: false,
				},
			};
			await ctx.parameter('configArgs', JSON.stringify(configArgs));

			const config = TransportConfig(configArgs);
			await ctx.parameter('TransportConfig', JSON.stringify(config));

			const layer = SMTPTransportConfig.makeLive(config);
			await ctx.parameter('layerCreated', String(Boolean(layer)));

			expect(layer).toBeTruthy();
		});
	});

	[
		{
			name: 'SMTPService - Should initialize with valid config',
			configLayer: 'use-valid',
		},
		{
			name: 'SMTPService - Should initialize with proxy config',
			configLayer: 'use-proxy',
		},
	].forEach(({ name, configLayer }) => {
		test(name, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('SMTPService Initialization Tests');
			await allure.tags(...sharedTags);
			await allure.parameter('configLayer', configLayer);

			let layerToUse: Layer<SMTPTransportConfig, never, never>;

			if (configLayer === 'use-valid') {
				layerToUse = testLayer;
			} else if (configLayer === 'use-proxy') {
				const proxyConfig = TransportConfig({
					transport: {
						host: testAccount.smtp.host,
						port: testAccount.smtp.port,
						secure: testAccount.smtp.secure,
						auth: {
							user: testAccount.user,
							pass: testAccount.pass,
						},
						proxy: 'socks://127.0.0.1:1080',
					},
				});
				layerToUse = SMTPTransportConfig.makeLive(proxyConfig);
			} else {
				throw new Error(`Unknown configLayer: ${configLayer}`);
			}

			const program = Effect.gen(function* () {
				const service = yield* SMTPService;
				return service;
			}).pipe(Effect.provide(SMTPService.Default));

			const runnable = Effect.provide(program, layerToUse);

			try {
				const result = await Effect.runPromise(runnable);
				await allure.step('SMTPService initialized successfully', async (ctx) => {
					await ctx.parameter('serviceInitialized', 'true');
					expect(result).toBeTruthy();
				});
			} catch (error) {
				await allure.step('SMTPService initialization failed', async (ctx) => {
					await ctx.parameter('serviceInitialized', 'false');
					await ctx.parameter('error', String(error));
					throw error;
				});
			}
		});
	});

	[
		{
			name: 'SMTPService - Verify Transport with Valid Config',
			configLayer: undefined,
		},
		{
			name: 'SMTPService - Verify Transport with Invalid Config',
			configLayer: SMTPTransportConfig.makeLive(
				TransportConfig({
					transport: {
						host: 'invalid-smtp-server.example.com',
						port: 587,
						secure: false,
						auth: {
							user: 'invalid@example.com',
							pass: 'wrongpassword',
						},
					},
				})
			),
		},
	].forEach(({ name, configLayer }) => {
		test(name, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('SMTPService Transport Verification Tests');
			await allure.tags(...sharedTags);
			await allure.parameter(
				'configLayer',
				String(configLayer ? 'custom-invalid' : 'default-valid')
			);

			const program = Effect.gen(function* () {
				const service = yield* SMTPService;
				const isVerified = yield* service.verifyTransport();
				return isVerified;
			}).pipe(Effect.provide(SMTPService.Default));

			const layerToUse = configLayer ? configLayer : testLayer;
			const runnable = Effect.provide(program, layerToUse);

			if (configLayer) {
				await allure.step('Expecting transport verification to fail', async (ctx) => {
					await ctx.parameter('expectedResult', 'failure');
					await expect(Effect.runPromise(runnable)).rejects.toThrow(
						/Failed to verify SMTP transport/
					);
				});
			} else {
				await allure.step('Expecting transport verification to succeed', async (ctx) => {
					const result = await Effect.runPromise(runnable);
					await ctx.parameter('expectedResult', 'success');
					await ctx.parameter('verificationResult', String(result));
					expect(typeof result).toBe('boolean');
					expect(result).toBe(true);
				});
			}
		});
	});

	[
		{
			name: 'SMTPService - Should send email successfully',
			mailOptions: (account: typeof testAccount) => ({
				from: account.user,
				to: 'recipient@example.com',
				subject: 'Test Email',
				text: 'This is a test email sent from Node.js test suite',
				html: '<p>This is a <b>test email</b> sent from Node.js test suite</p>',
			}),
			toPass: true,
		},
		{
			name: 'SMTPService - Should fail to send email with invalid options',
			mailOptions: () => ({
				from: '',
				to: '',
				subject: 'Test Email',
				text: 'This should fail',
			}),
			toPass: false,
		},
	].forEach(({ name, mailOptions, toPass }) => {
		test(name, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('Mail Sending Tests');
			await allure.tags(...sharedTags);
			await allure.parameter('toPass', String(toPass));

			const options = mailOptions(testAccount);
			await allure.step('Mail Options Prepared', async (ctx) => {
				await ctx.parameter('mailOptions', JSON.stringify(options));
			});

			const program = Effect.gen(function* () {
				const service = yield* SMTPService;
				const result = yield* service.sendMail(options);
				return result;
			}).pipe(Effect.provide(SMTPService.Default));

			const runnable = Effect.provide(program, testLayer);

			if (toPass) {
				const result = await Effect.runPromise(runnable);
				await allure.step('Email sent successfully', async (ctx) => {
					await ctx.parameter('messageId', result.messageId);
					await ctx.parameter('response', result.response);
					const previewUrl = nodemailer.getTestMessageUrl(result);
					if (previewUrl) {
						await ctx.parameter('previewUrl', previewUrl);
						await allure.link(previewUrl, 'Email Preview URL');
					}
					expect(result).toBeTruthy();
					expect(result.messageId).toBeTruthy();
				});
			} else {
				await allure.step('Expecting email sending to fail', async () => {
					await expect(Effect.runPromise(runnable)).rejects.toThrow(/Failed to send mail/);
				});
			}
		});
	});

	[
		{
			name: 'SMTPService - Transport Status Methods (isIdle)',
			method: 'isIdle',
		},
		{
			name: 'SMTPService - Transport Status Methods (getVersionString)',
			method: 'getVersionString',
		},
	].forEach(({ name, method }) => {
		test(name, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('Transport Status Method Tests');
			await allure.tags(...sharedTags);
			await allure.parameter('method', method);

			const program = Effect.gen(function* () {
				const service = yield* SMTPService;
				let result: boolean | string;
				if (method === 'isIdle') {
					result = yield* service.isIdle();
				} else if (method === 'getVersionString') {
					result = yield* service.getVersionString();
				} else {
					throw new Error(`Unknown method: ${method}`);
				}
				return result;
			}).pipe(Effect.provide(SMTPService.Default));

			const runnable = Effect.provide(program, testLayer);
			const result = await Effect.runPromise(runnable);

			await allure.step(`Method ${method} executed`, async (ctx) => {
				await ctx.parameter('result', String(result));
				if (method === 'isIdle') {
					expect(typeof result).toBe('boolean');
				} else if (method === 'getVersionString') {
					expect(typeof result).toBe('string');
					expect((result as string).length).toBeGreaterThan(0);
				}
			});
		});
	});

	test('SMTPService - Full Integration Test', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('Integration Tests');
		await allure.tags(...sharedTags);

		let program: Effect.Effect<
			{
				verified: true;
				sent: boolean;
				version: string;
			},
			Error,
			SMTPTransportConfig
		>;

		await allure.step('Building Effect program for end-to-end test', async (ctx) => {
			await ctx.parameter('testAccountUser', testAccount.user);

			program = Effect.gen(function* () {
				const service = yield* SMTPService;

				const isVerified = yield* service.verifyTransport();
				expect(isVerified).toBe(true);

				const isIdle = yield* service.isIdle();
				expect(typeof isIdle).toBe('boolean');

				const mailResult = yield* service.sendMail({
					from: testAccount.user,
					to: 'test@example.com',
					subject: 'Integration Test',
					text: 'End-to-end test email',
				});

				expect(mailResult.messageId).toBeTruthy();

				const previewUrl = nodemailer.getTestMessageUrl(mailResult);

				const version = yield* service.getVersionString();
				expect(version.length).toBeGreaterThan(0);

				return {
					verified: isVerified,
					sent: !!mailResult.messageId,
					version,
					previewUrl,
				};
			}).pipe(Effect.provide(SMTPService.Default));
		});

		let runnable: Effect.Effect<
			{
				verified: true;
				sent: boolean;
				version: string;
				previewUrl?: string;
			},
			Error,
			never
		>;

		await allure.step('Providing test layer to the Effect program', async (ctx) => {
			runnable = Effect.provide(program, testLayer);
			await ctx.parameter('layerProvided', 'true');
		});

		await allure.step('Running the Effect program', async (ctx) => {
			const result = await Effect.runPromise(runnable);

			await ctx.parameter('verified', String(result.verified));
			await ctx.parameter('sent', String(result.sent));
			await ctx.parameter('version', result.version);

			const previewUrl = result.previewUrl;

			if (previewUrl) {
				await allure.step('Email sent successfully in integration test', async (ctx) => {
					await ctx.parameter('previewUrl', previewUrl);
					await allure.link(previewUrl, 'Integration Test Email Preview URL');
				});
			}

			expect(result.verified).toBe(true);
			expect(result.sent).toBe(true);
			expect(result.version).toBeTruthy();
		});
	});
});
