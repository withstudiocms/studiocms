import { describe, expect, it } from 'vitest';
import {
	authConfigSchema,
	authProviderSchema,
	localUsernameAndPasswordConfig,
} from '../../../src/schemas/config/auth';

describe('localUsernameAndPasswordConfig', () => {
	it('should default allowUserRegistration to true', () => {
		const result = localUsernameAndPasswordConfig.parse({});
		expect(result.allowUserRegistration).toBe(true);
	});

	it('should accept allowUserRegistration as false', () => {
		const result = localUsernameAndPasswordConfig.parse({ allowUserRegistration: false });
		expect(result.allowUserRegistration).toBe(false);
	});

	it('should allow undefined input and default to {}', () => {
		const result = localUsernameAndPasswordConfig.parse(undefined);
		expect(result).toEqual({
			allowUserRegistration: true,
		});
	});
});

describe('authProviderSchema', () => {
	it('should default usernameAndPassword to true', () => {
		const result = authProviderSchema.parse({});
		expect(result.usernameAndPassword).toBe(true);
	});

	it('should accept usernameAndPassword as false', () => {
		const result = authProviderSchema.parse({ usernameAndPassword: false });
		expect(result.usernameAndPassword).toBe(false);
	});

	it('should default usernameAndPasswordConfig to {}', () => {
		const result = authProviderSchema.parse({});
		expect(result.usernameAndPasswordConfig).toEqual({
			allowUserRegistration: true,
		});
	});

	it('should allow undefined input and default to {}', () => {
		const result = authProviderSchema.parse(undefined);
		expect(result).toEqual({
			usernameAndPassword: true,
			usernameAndPasswordConfig: {
				allowUserRegistration: true,
			},
		});
	});
});

describe('authConfigSchema', () => {
	it('should default enabled to true', () => {
		const result = authConfigSchema.parse({});
		expect(result.enabled).toBe(true);
	});

	it('should accept enabled as false', () => {
		const result = authConfigSchema.parse({ enabled: false });
		expect(result.enabled).toBe(false);
	});

	it('should default providers to {}', () => {
		const result = authConfigSchema.parse({});
		expect(result.providers).toEqual({
			usernameAndPassword: true,
			usernameAndPasswordConfig: {
				allowUserRegistration: true,
			},
		});
	});

	it('should allow undefined input and default to {}', () => {
		const result = authConfigSchema.parse(undefined);
		expect(result).toEqual({
			enabled: true,
			providers: {
				usernameAndPassword: true,
				usernameAndPasswordConfig: {
					allowUserRegistration: true,
				},
			},
		});
	});

	it('should accept full config', () => {
		const input = {
			enabled: false,
			providers: {
				usernameAndPassword: false,
				usernameAndPasswordConfig: { allowUserRegistration: false },
			},
		};
		const result = authConfigSchema.parse(input);
		expect(result.enabled).toBe(false);
		expect(result.providers.usernameAndPassword).toBe(false);
		expect(result.providers.usernameAndPasswordConfig.allowUserRegistration).toBe(false);
	});
});
