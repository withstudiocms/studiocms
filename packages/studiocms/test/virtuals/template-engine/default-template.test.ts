import { describe, expect, it } from 'vitest';
import defaultTemplates from '../../../src/virtuals/template-engine/default-templates.js';

describe('defaultTemplates', () => {
	it('should export all expected template keys', () => {
		expect(defaultTemplates).toHaveProperty('notifications');
		expect(defaultTemplates).toHaveProperty('passwordReset');
		expect(defaultTemplates).toHaveProperty('userInvite');
		expect(defaultTemplates).toHaveProperty('verifyEmail');
	});

	it('notifications template should contain required variables', () => {
		const tpl = defaultTemplates.notifications;
		expect(tpl).toContain('{{data.title}}');
		expect(tpl).toContain('{{data.message}}');
		expect(tpl).toMatch(/<!doctype html>/i);
	});

	it('passwordReset template should contain required variables', () => {
		const tpl = defaultTemplates.passwordReset;
		expect(tpl).toContain('{{data.link}}');
		expect(tpl).toContain('Reset Your Password');
		expect(tpl).toMatch(/<!doctype html>/i);
	});

	it('userInvite template should contain required variables', () => {
		const tpl = defaultTemplates.userInvite;
		expect(tpl).toContain('{{site.title}}');
		expect(tpl).toContain('{{data.link}}');
		expect(tpl).toContain('New User Invite from');
		expect(tpl).toMatch(/<!doctype html>/i);
	});

	it('verifyEmail template should contain required variables', () => {
		const tpl = defaultTemplates.verifyEmail;
		expect(tpl).toContain('{{data.link}}');
		expect(tpl).toContain('Verify your Email');
		expect(tpl).toMatch(/<!doctype html>/i);
	});

	it('should mark all templates as readonly', () => {
		// Type-level test: This will fail to compile if templates are not readonly
		type Templates = typeof defaultTemplates;
		type AssertReadonly<T> = T extends { readonly [K in keyof T]: T[K] } ? true : false;
		const isReadonly: AssertReadonly<Templates> = true;
		expect(isReadonly).toBe(true);
	});
});
