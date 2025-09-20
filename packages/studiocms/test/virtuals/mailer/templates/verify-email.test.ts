import { describe, expect, it } from 'vitest';
import { verifyEmail } from '../../../../src/virtuals/mailer/templates/index';

describe('verifyEmail template', () => {
	it('should return an HTML string containing the provided link', () => {
		const testLink = 'https://example.com/verify?token=abc123';
		const html = verifyEmail(testLink);

		expect(html).toContain('<!doctype html>');
		expect(html).toContain(`<a
                  href="${testLink}"`);
		expect(html).toContain(`Link: ${testLink}`);
		expect(html).toContain('<body>');
		expect(html).toContain('Verify your Email');
	});

	it('should work with a URL object', () => {
		const url = new URL('https://example.com/verify?token=xyz789');
		const html = verifyEmail(url);

		expect(html).toContain(url.toString());
		expect(html).toContain(`<a
                  href="${url.toString()}"`);
	});

	it('should include the button and instructions', () => {
		const link = 'https://foo.bar';
		const html = verifyEmail(link);

		expect(html).toMatch(/Click the button below, or copy-paste the link/i);
		expect(html).toMatch(/<span>Verify Email<\/span>/);
	});
});
