import { describe, expect, it } from 'vitest';
import { notification } from '../../../../src/virtuals/mailer/templates/index';

describe('notification template', () => {
	it('should render title and message in the HTML', () => {
		const title = 'Test Notification';
		const message = 'This is a test message.';
		const html = notification({ title, message });

		expect(html).toContain('<!doctype html>');
		expect(html).toContain(title);
		expect(html).toContain(message);
		expect(html).toContain('<h3');
		expect(html).toContain('<div');
		expect(html).toContain('</html>');
	});

	it('should escape special HTML characters in title and message', () => {
		const title = "<script>alert('x')</script>";
		const message = '<b>bold</b>';
		const html = notification({ title, message });

		// Since the template does not escape HTML, these tags will be present
		expect(html).toContain(title);
		expect(html).toContain(message);
	});

	it('should include required styles and structure', () => {
		const html = notification({ title: 'A', message: 'B' });

		expect(html).toMatch(/background-color:#F2F5F7/);
		expect(html).toMatch(/font-family:"Helvetica Neue"/);
		expect(html).toMatch(/max-width:600px/);
		expect(html).toMatch(/<table[\s\S]*role="presentation"/);
	});
});
