import { describe, expect, it } from 'vitest';
import { getTemplate, templates } from '../../../src/virtuals/mailer/template';

describe('getTemplate', () => {
	it('should return the verifyEmail template', () => {
		expect(getTemplate('verifyEmail')).toBe(templates.verifyEmail);
	});

	it('should return the notification template', () => {
		expect(getTemplate('notification')).toBe(templates.notification);
	});

	it('should return the passwordReset template', () => {
		expect(getTemplate('passwordReset')).toBe(templates.passwordReset);
	});

	it('should return the userInvite template', () => {
		expect(getTemplate('userInvite')).toBe(templates.userInvite);
	});
});
