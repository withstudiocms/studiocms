import { describe, expect, it } from 'vitest';
import { passwordReset } from '../../../../src/virtuals/mailer/templates/index';

describe('passwordReset template', () => {
	it('should return an HTML string containing the provided link (string)', () => {
		const link = 'https://example.com/reset?token=abc123';
		const html = passwordReset(link);
		expect(html).toContain('<!doctype html>');
		expect(html).toContain(`href="${link}"`);
		expect(html).toContain(`Link: ${link}`);
		expect(html).toContain('Reset Your Password');
		expect(html).toContain('<body>');
	});

	it('should return an HTML string containing the provided link (URL object)', () => {
		const url = new URL('https://example.com/reset?token=xyz789');
		const html = passwordReset(url);
		expect(html).toContain(`href="${url.toString()}"`);
		expect(html).toContain(`Link: ${url.toString()}`);
	});

	it('should include instructions for password reset and ignoring if not requested', () => {
		const link = 'https://example.com/reset';
		const html = passwordReset(link);
		expect(html).toMatch(/If you didn't request a password reset, you can ignore this email/);
		expect(html).toMatch(/Click the button below, or copy-paste the link to reset your password/);
	});

	it('should have a Reset Password button with correct styles', () => {
		const link = 'https://example.com/reset';
		const html = passwordReset(link);
		expect(html).toMatch(
			/<a\s+href="https:\/\/example\.com\/reset"[^>]*style="[^"]*background-color:#0068FF[^"]*"[^>]*>/
		);
		expect(html).toContain('<span>Reset Password</span>');
	});
});
