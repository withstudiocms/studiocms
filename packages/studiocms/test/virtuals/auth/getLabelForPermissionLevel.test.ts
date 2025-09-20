import { describe, expect, it } from 'vitest';
import { getLabelForPermissionLevel } from '../../../src/virtuals/auth/getLabelForPermissionLevel';

describe('getLabelForPermissionLevel', () => {
	it('returns "Administrator" for "admin"', () => {
		expect(getLabelForPermissionLevel('admin')).toBe('Administrator');
	});

	it('returns "Editor" for "editor"', () => {
		expect(getLabelForPermissionLevel('editor')).toBe('Editor');
	});

	it('returns "Owner" for "owner"', () => {
		expect(getLabelForPermissionLevel('owner')).toBe('Owner');
	});

	it('returns "Visitor" for "visitor"', () => {
		expect(getLabelForPermissionLevel('visitor')).toBe('Visitor');
	});

	it('returns "Unknown" for unknown permission levels', () => {
		expect(getLabelForPermissionLevel('superuser')).toBe('Unknown');
		expect(getLabelForPermissionLevel('')).toBe('Unknown');
		expect(getLabelForPermissionLevel('random')).toBe('Unknown');
	});
});
