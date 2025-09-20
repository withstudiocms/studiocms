import { describe, expect, it } from 'vitest';
import { StudioCMSCoreError, StudioCMSError } from '../src/errors';

describe('StudioCMSError', () => {
	it('should be instance of AstroError', () => {
		const error = new StudioCMSError('Test message');
		expect(error).toBeInstanceOf(Error);
		expect(error.name).toBe('StudioCMS Error');
		expect(error.message).toBe('Test message');
	});

	it('should allow custom message and hint', () => {
		const error = new StudioCMSError('Custom error', 'This is a hint');
		expect(error.message).toBe('Custom error');
		expect(error.hint).toBe('This is a hint');
	});
});

describe('StudioCMSCoreError', () => {
	it('should be instance of StudioCMSError', () => {
		const error = new StudioCMSCoreError('Core error');
		expect(error).toBeInstanceOf(StudioCMSError);
		expect(error.name).toBe('StudioCMS Core Error');
		expect(error.message).toBe('Core error');
	});

	it('should inherit properties from StudioCMSError', () => {
		const error = new StudioCMSCoreError('Another core error', 'extra hint');
		expect(error.message).toBe('Another core error');
		expect(error.hint).toBe('extra hint');
	});
});
