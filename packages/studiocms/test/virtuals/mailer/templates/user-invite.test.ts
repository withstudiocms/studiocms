import { describe, expect, it } from 'vitest';
import { userInvite } from '../../../../src/virtuals/mailer/templates/index';

describe('userInvite template', () => {
	const title = 'StudioCMS';
	const link = 'https://example.com/invite?token=abc123';

	it('returns an HTML string', () => {
		const html = userInvite({ title, link });
		expect(typeof html).toBe('string');
		expect(html.trim().startsWith('<!doctype html>')).toBe(true);
	});

	it('includes the provided title in the heading and body', () => {
		const html = userInvite({ title, link });
		expect(html).toContain(`New User Invite from ${title}`);
		expect(html).toContain(`You have been invited to join ${title}!`);
	});

	it('includes the provided link in the button and as plain text', () => {
		const html = userInvite({ title, link });
		expect(html).toContain(`href="${link}"`);
		expect(html).toContain(`Link: ${link}`);
	});

	it('works with a URL object for the link', () => {
		const url = new URL(link);
		const html = userInvite({ title, link: url });
		expect(html).toContain(`href="${url.toString()}"`);
		expect(html).toContain(`Link: ${url.toString()}`);
	});

	it('renders the Set Password button', () => {
		const html = userInvite({ title, link });
		expect(html).toContain('>Set Password<');
	});
});
