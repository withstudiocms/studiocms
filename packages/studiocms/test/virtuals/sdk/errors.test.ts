import { describe, expect, it } from 'vitest';
import { SDKCoreError, StudioCMS_SDK_Error } from '../../../src/virtuals/sdk/errors';

describe('StudioCMS_SDK_Error', () => {
	it('should set the correct name and message', () => {
		const err = new StudioCMS_SDK_Error('Test error');
		expect(err.name).toBe('StudioCMS SDK Error');
		expect(err.message).toBe('Test error');
		expect(err).toBeInstanceOf(StudioCMS_SDK_Error);
	});
});

describe('SDKCoreError', () => {
	it('should set type and cause correctly', () => {
		const cause = new StudioCMS_SDK_Error('Database failure');
		const error = new SDKCoreError({ type: 'LibSQLDatabaseError', cause });
		expect(error.type).toBe('LibSQLDatabaseError');
		expect(error.cause).toBe(cause);
	});

	it('should return the correct message from cause', () => {
		const cause = new StudioCMS_SDK_Error('Unknown error');
		const error = new SDKCoreError({ type: 'UNKNOWN', cause });
		expect(error.message).toBe('Unknown error');
	});

	it('toString should include the cause message', () => {
		const cause = new StudioCMS_SDK_Error('Something went wrong');
		const error = new SDKCoreError({ type: 'UNKNOWN', cause });
		expect(error.toString()).toBe('SDKCoreError: Something went wrong');
	});
});
