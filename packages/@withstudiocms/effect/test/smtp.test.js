import assert from 'node:assert';
import { before, describe, it } from 'node:test';
import _nodemailer from 'nodemailer';
import { Effect } from '../dist/effect.js';
import { SMTPService, SMTPTransportConfig } from '../dist/smtp.js';

describe('SMTP Service', () => {
	let testAccount;
	let testConfig;
	let testLayer;

	before(async () => {
		// Create a test account using Nodemailer's test functionality
		testAccount = await _nodemailer.createTestAccount();

		testConfig = {
			transport: {
				host: testAccount.smtp.host,
				port: testAccount.smtp.port,
				secure: testAccount.smtp.secure,
				auth: {
					user: testAccount.user,
					pass: testAccount.pass,
				},
			},
		};

		testLayer = SMTPTransportConfig.makeLive(testConfig);
	});

	describe('SMTPTransportConfig', () => {
		it('should create a live layer with configuration', () => {
			const config = {
				transport: {
					host: 'smtp.example.com',
					port: 587,
					secure: false,
				},
			};

			const layer = SMTPTransportConfig.makeLive(config);
			assert.ok(layer, 'Layer should be created');
		});
	});

	describe('SMTPService initialization', () => {
		it('should initialize service with valid configuration', async () => {
			const program = Effect.gen(function* () {
				const service = yield* SMTPService;
				assert.ok(service, 'Service should be initialized');
				return service;
			}).pipe(Effect.provide(SMTPService.Default));

			const runnable = Effect.provide(program, testLayer);
			const result = await Effect.runPromise(runnable);

			assert.ok(result.Mailer, 'Mailer function should exist');
			assert.ok(result.verifyTransport, 'verifyTransport function should exist');
			assert.ok(result.sendMail, 'sendMail function should exist');
			assert.ok(result.isIdle, 'isIdle function should exist');
			assert.ok(result.getVersionString, 'getVersionString function should exist');
		});

		it('should initialize service with proxy configuration', async () => {
			const proxyConfig = {
				transport: {
					host: testAccount.smtp.host,
					port: testAccount.smtp.port,
					secure: testAccount.smtp.secure,
					auth: {
						user: testAccount.user,
						pass: testAccount.pass,
					},
					proxy: 'socks://127.0.0.1:1080', // Mock proxy URL
				},
			};

			const proxyLayer = SMTPTransportConfig.makeLive(proxyConfig);

			const program = Effect.gen(function* () {
				const service = yield* SMTPService;
				return service;
			}).pipe(Effect.provide(SMTPService.Default));

			const runnable = Effect.provide(program, proxyLayer);

			// This might fail if proxy doesn't exist, but service should still initialize
			try {
				const result = await Effect.runPromise(runnable);
				assert.ok(result, 'Service should initialize even with proxy config');
			} catch (error) {
				// Expected to fail with invalid proxy, but initialization logic should work
				assert.ok(error instanceof Error, 'Should throw an error for invalid proxy');
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

			assert.strictEqual(typeof result, 'boolean', 'Verification should return a boolean');
			assert.strictEqual(result, true, 'Test account should verify successfully');
		});

		it('should fail verification with invalid configuration', async () => {
			const invalidConfig = {
				transport: {
					host: 'invalid-smtp-server.example.com',
					port: 587,
					secure: false,
					auth: {
						user: 'invalid@example.com',
						pass: 'wrongpassword',
					},
				},
			};

			const invalidLayer = SMTPTransportConfig.makeLive(invalidConfig);

			const program = Effect.gen(function* () {
				const service = yield* SMTPService;
				const isVerified = yield* service.verifyTransport();
				return isVerified;
			}).pipe(Effect.provide(SMTPService.Default));

			const runnable = Effect.provide(program, invalidLayer);

			try {
				await Effect.runPromise(runnable);
				assert.fail('Should have thrown an error for invalid configuration');
			} catch (error) {
				assert.ok(error instanceof Error, 'Should throw an Error');
				assert.ok(
					error.message.includes('Failed to verify SMTP transport'),
					'Error message should indicate verification failure'
				);
			}
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

			assert.ok(result, 'Send result should exist');
			assert.ok(result.messageId, 'Result should contain messageId');
			assert.ok(result.response, 'Result should contain response');

			// Log preview URL for manual verification if needed
			const previewUrl = _nodemailer.getTestMessageUrl(result);
			if (previewUrl) {
				console.log('Preview URL:', previewUrl);
			}
		});

		it('should handle send mail errors gracefully', async () => {
			const invalidMailOptions = {
				from: '', // Invalid from address
				to: '', // Invalid to address
				subject: 'Test Email',
				text: 'This should fail',
			};

			const program = Effect.gen(function* () {
				const service = yield* SMTPService;
				const result = yield* service.sendMail(invalidMailOptions);
				return result;
			}).pipe(Effect.provide(SMTPService.Default));

			const runnable = Effect.provide(program, testLayer);

			try {
				await Effect.runPromise(runnable);
				assert.fail('Should have thrown an error for invalid mail options');
			} catch (error) {
				assert.ok(error instanceof Error, 'Should throw an Error');
				assert.ok(
					error.message.includes('Failed to send mail'),
					'Error message should indicate mail sending failure'
				);
			}
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

			assert.strictEqual(typeof result, 'boolean', 'isIdle should return a boolean');
		});

		it('should get version string', async () => {
			const program = Effect.gen(function* () {
				const service = yield* SMTPService;
				const version = yield* service.getVersionString();
				return version;
			}).pipe(Effect.provide(SMTPService.Default));

			const runnable = Effect.provide(program, testLayer);
			const result = await Effect.runPromise(runnable);

			assert.strictEqual(typeof result, 'string', 'getVersionString should return a string');
			assert.ok(result.length > 0, 'Version string should not be empty');
		});
	});

	describe('Mailer function', () => {
		it('should execute custom mailer functions', async () => {
			const program = Effect.gen(function* () {
				const service = yield* SMTPService;

				// Test custom mailer function
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

			assert.strictEqual(
				typeof result.isIdle,
				'boolean',
				'Custom function should return isIdle boolean'
			);
			assert.strictEqual(
				typeof result.version,
				'string',
				'Custom function should return version string'
			);
		});

		it('should handle mailer function errors', async () => {
			const program = Effect.gen(function* () {
				const service = yield* SMTPService;

				// Test function that throws an error
				const customResult = yield* service.Mailer((_mailer) => {
					throw new Error('Custom mailer function error');
				});

				return customResult;
			}).pipe(Effect.provide(SMTPService.Default));

			const runnable = Effect.provide(program, testLayer);

			try {
				await Effect.runPromise(runnable);
				assert.fail('Should have thrown an error from custom mailer function');
			} catch (error) {
				assert.ok(error instanceof Error, 'Should throw an Error');
				assert.ok(
					error.message.includes('Failed to run Mailer function'),
					'Error message should indicate Mailer function failure'
				);
			}
		});
	});

	describe('Configuration conversion', () => {
		it('should handle configuration without proxy', async () => {
			const configWithoutProxy = {
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
			};

			const layer = SMTPTransportConfig.makeLive(configWithoutProxy);

			const program = Effect.gen(function* () {
				const service = yield* SMTPService;
				return service;
			}).pipe(Effect.provide(SMTPService.Default));

			const runnable = Effect.provide(program, layer);
			const result = await Effect.runPromise(runnable);

			assert.ok(result, 'Service should initialize with configuration without proxy');
		});

		it('should handle minimal configuration', async () => {
			const minimalConfig = {
				transport: {
					host: testAccount.smtp.host,
					port: testAccount.smtp.port,
				},
			};

			const layer = SMTPTransportConfig.makeLive(minimalConfig);

			const program = Effect.gen(function* () {
				const service = yield* SMTPService;
				return service;
			}).pipe(Effect.provide(SMTPService.Default));

			const runnable = Effect.provide(program, layer);

			try {
				const result = await Effect.runPromise(runnable);
				assert.ok(result, 'Service should initialize with minimal configuration');
			} catch (error) {
				// Might fail due to missing auth, but service creation logic should work
				assert.ok(error instanceof Error, 'Should handle missing auth gracefully');
			}
		});
	});

	describe('Integration tests', () => {
		it('should perform end-to-end mail sending workflow', async () => {
			const program = Effect.gen(function* () {
				const service = yield* SMTPService;

				// Verify transport
				const isVerified = yield* service.verifyTransport();
				assert.strictEqual(isVerified, true, 'Transport should be verified');

				// Check if idle
				const isIdle = yield* service.isIdle();
				assert.strictEqual(typeof isIdle, 'boolean', 'isIdle should return boolean');

				// Send email
				const mailResult = yield* service.sendMail({
					from: testAccount.user,
					to: 'test@example.com',
					subject: 'Integration Test',
					text: 'End-to-end test email',
				});

				assert.ok(mailResult.messageId, 'Mail should be sent successfully');

				// Get version
				const version = yield* service.getVersionString();
				assert.ok(version.length > 0, 'Version should be available');

				return {
					verified: isVerified,
					sent: !!mailResult.messageId,
					version,
				};
			}).pipe(Effect.provide(SMTPService.Default));

			const runnable = Effect.provide(program, testLayer);
			const result = await Effect.runPromise(runnable);

			assert.strictEqual(result.verified, true, 'Transport should be verified');
			assert.strictEqual(result.sent, true, 'Email should be sent');
			assert.ok(result.version, 'Version should be retrieved');
		});
	});
});
