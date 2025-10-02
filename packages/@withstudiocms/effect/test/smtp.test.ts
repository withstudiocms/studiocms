import type { Layer } from 'effect/Layer';
import nodemailer from 'nodemailer';
import { beforeAll, describe, expect, it } from 'vitest';
import { Effect } from '../src/effect.js';
import { SMTPService, SMTPTransportConfig, TransportConfig } from '../src/smtp.js';

describe('SMTP Service', { timeout: 10000 }, () => {
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

	describe('SMTPTransportConfig', () => {
		it('should create a live layer with configuration', () => {
			const config = TransportConfig({
				transport: {
					host: 'smtp.example.com',
					port: 587,
					secure: false,
				},
			});

			const layer = SMTPTransportConfig.makeLive(config);
			expect(layer).toBeTruthy();
		});
	});

	describe('SMTPService initialization', () => {
		it('should initialize service with valid configuration', async () => {
			const program = Effect.gen(function* () {
				const service = yield* SMTPService;
				expect(service).toBeTruthy();
				return service;
			}).pipe(Effect.provide(SMTPService.Default));

			const runnable = Effect.provide(program, testLayer);
			const result = await Effect.runPromise(runnable);

			expect(result.Mailer).toBeTypeOf('function');
			expect(result.verifyTransport).toBeTypeOf('function');
			expect(result.sendMail).toBeTypeOf('function');
			expect(result.isIdle).toBeTypeOf('function');
			expect(result.getVersionString).toBeTypeOf('function');
		});

		it('should initialize service with proxy configuration', async () => {
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

			const proxyLayer = SMTPTransportConfig.makeLive(proxyConfig);

			const program = Effect.gen(function* () {
				const service = yield* SMTPService;
				return service;
			}).pipe(Effect.provide(SMTPService.Default));

			const runnable = Effect.provide(program, proxyLayer);

			try {
				const result = await Effect.runPromise(runnable);
				expect(result).toBeTruthy();
			} catch (error) {
				expect(error instanceof Error).toBe(true);
			}
		});
	});

	describe('Transport verification', () => {
		it('should verify transport successfully with valid configuration', async () => {
			const program = Effect.gen(function* () {
				const service = yield* SMTPService;
				const isVerified = yield* service.verifyTransport();
				return isVerified;
			}).pipe(Effect.provide(SMTPService.Default));

			const runnable = Effect.provide(program, testLayer);
			const result = await Effect.runPromise(runnable);

			expect(typeof result).toBe('boolean');
			expect(result).toBe(true);
		});

		it('should fail verification with invalid configuration', async () => {
			const invalidConfig = TransportConfig({
				transport: {
					host: 'invalid-smtp-server.example.com',
					port: 587,
					secure: false,
					auth: {
						user: 'invalid@example.com',
						pass: 'wrongpassword',
					},
				},
			});

			const invalidLayer = SMTPTransportConfig.makeLive(invalidConfig);

			const program = Effect.gen(function* () {
				const service = yield* SMTPService;
				const isVerified = yield* service.verifyTransport();
				return isVerified;
			}).pipe(Effect.provide(SMTPService.Default));

			const runnable = Effect.provide(program, invalidLayer);

			await expect(Effect.runPromise(runnable)).rejects.toThrow(/Failed to verify SMTP transport/);
		});
	});

	describe('Mail sending', () => {
		it('should send email successfully', async () => {
			const mailOptions = {
				from: testAccount.user,
				to: 'recipient@example.com',
				subject: 'Test Email',
				text: 'This is a test email sent from Node.js test suite',
				html: '<p>This is a <b>test email</b> sent from Node.js test suite</p>',
			};

			const program = Effect.gen(function* () {
				const service = yield* SMTPService;
				const result = yield* service.sendMail(mailOptions);
				return result;
			}).pipe(Effect.provide(SMTPService.Default));

			const runnable = Effect.provide(program, testLayer);
			const result = await Effect.runPromise(runnable);

			expect(result).toBeTruthy();
			expect(result.messageId).toBeTruthy();
			expect(result.response).toBeTruthy();

			const previewUrl = nodemailer.getTestMessageUrl(result);
			if (previewUrl) {
				console.log('Preview URL:', previewUrl);
			}
		});

		it('should handle send mail errors gracefully', async () => {
			const invalidMailOptions = {
				from: '',
				to: '',
				subject: 'Test Email',
				text: 'This should fail',
			};

			const program = Effect.gen(function* () {
				const service = yield* SMTPService;
				const result = yield* service.sendMail(invalidMailOptions);
				return result;
			}).pipe(Effect.provide(SMTPService.Default));

			const runnable = Effect.provide(program, testLayer);

			await expect(Effect.runPromise(runnable)).rejects.toThrow(/Failed to send mail/);
		});
	});

	describe('Transport status methods', () => {
		it('should check if transport is idle', async () => {
			const program = Effect.gen(function* () {
				const service = yield* SMTPService;
				const idle = yield* service.isIdle();
				return idle;
			}).pipe(Effect.provide(SMTPService.Default));

			const runnable = Effect.provide(program, testLayer);
			const result = await Effect.runPromise(runnable);

			expect(typeof result).toBe('boolean');
		});

		it('should get version string', async () => {
			const program = Effect.gen(function* () {
				const service = yield* SMTPService;
				const version = yield* service.getVersionString();
				return version;
			}).pipe(Effect.provide(SMTPService.Default));

			const runnable = Effect.provide(program, testLayer);
			const result = await Effect.runPromise(runnable);

			expect(typeof result).toBe('string');
			expect(result.length).toBeGreaterThan(0);
		});
	});

	describe('Mailer function', () => {
		it('should execute custom mailer functions', async () => {
			const program = Effect.gen(function* () {
				const service = yield* SMTPService;
				const customResult = yield* service.Mailer((mailer) => {
					return {
						isIdle: mailer.isIdle(),
						version: mailer.getVersionString(),
					};
				});
				return customResult;
			}).pipe(Effect.provide(SMTPService.Default));

			const runnable = Effect.provide(program, testLayer);
			const result = await Effect.runPromise(runnable);

			expect(typeof result.isIdle).toBe('boolean');
			expect(typeof result.version).toBe('string');
		});

		it('should handle mailer function errors', async () => {
			const program = Effect.gen(function* () {
				const service = yield* SMTPService;
				// @effect-diagnostics-next-line missingReturnYieldStar:off
				const customResult = yield* service.Mailer((_mailer) => {
					throw new Error('Custom mailer function error');
				});
				return customResult;
			}).pipe(Effect.provide(SMTPService.Default));

			const runnable = Effect.provide(program, testLayer);

			await expect(Effect.runPromise(runnable)).rejects.toThrow(/Failed to run Mailer function/);
		});
	});

	describe('Configuration conversion', () => {
		it('should handle configuration without proxy', async () => {
			const configWithoutProxy = TransportConfig({
				transport: {
					host: testAccount.smtp.host,
					port: testAccount.smtp.port,
					secure: testAccount.smtp.secure,
					auth: {
						user: testAccount.user,
						pass: testAccount.pass,
					},
				},
				defaults: {
					from: 'default@example.com',
				},
			});

			const layer = SMTPTransportConfig.makeLive(configWithoutProxy);

			const program = Effect.gen(function* () {
				const service = yield* SMTPService;
				return service;
			}).pipe(Effect.provide(SMTPService.Default));

			const runnable = Effect.provide(program, layer);
			const result = await Effect.runPromise(runnable);

			expect(result).toBeTruthy();
		});

		it('should handle minimal configuration', async () => {
			const minimalConfig = TransportConfig({
				transport: {
					host: testAccount.smtp.host,
					port: testAccount.smtp.port,
				},
			});

			const layer = SMTPTransportConfig.makeLive(minimalConfig);

			const program = Effect.gen(function* () {
				const service = yield* SMTPService;
				return service;
			}).pipe(Effect.provide(SMTPService.Default));

			const runnable = Effect.provide(program, layer);

			try {
				const result = await Effect.runPromise(runnable);
				expect(result).toBeTruthy();
			} catch (error) {
				expect(error instanceof Error).toBe(true);
			}
		});
	});

	describe('Integration tests', () => {
		it('should perform end-to-end mail sending workflow', async () => {
			const program = Effect.gen(function* () {
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

				const version = yield* service.getVersionString();
				expect(version.length).toBeGreaterThan(0);

				return {
					verified: isVerified,
					sent: !!mailResult.messageId,
					version,
				};
			}).pipe(Effect.provide(SMTPService.Default));

			const runnable = Effect.provide(program, testLayer);
			const result = await Effect.runPromise(runnable);

			expect(result.verified).toBe(true);
			expect(result.sent).toBe(true);
			expect(result.version).toBeTruthy();
		});
	});
});
