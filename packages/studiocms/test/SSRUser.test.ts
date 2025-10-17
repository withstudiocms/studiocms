import { describe, it, expect, beforeEach } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import SSRUser from '../src/components/shared/SSRUser.astro';

describe('SSRUser Component', () => {
	let container: AstroContainer;

	beforeEach(async () => {
		container = await AstroContainer.create();
	});

	it('should render with name and description', async () => {
		const result = await container.renderToString(SSRUser, {
			props: {
				name: 'John Doe',
				description: 'Software Engineer',
				id: 'test-user-1',
			},
		});

		expect(result).toContain('John Doe');
		expect(result).toContain('Software Engineer');
	});

	it('should render with avatar URL', async () => {
		const result = await container.renderToString(SSRUser, {
			props: {
				name: 'Jane Doe',
				description: 'Designer',
				avatar: 'https://example.com/avatar.jpg',
				id: 'test-user-2',
			},
		});

		expect(result).toContain('<studiocms-avatar');
		expect(result).toContain('data-avatar-url="https://example.com/avatar.jpg"');
	});

	it('should render without avatar', async () => {
		const result = await container.renderToString(SSRUser, {
			props: {
				name: 'Bob Smith',
				description: 'Developer',
				id: 'test-user-3',
			},
		});

		expect(result).toContain('<svg');
		expect(result).toContain('Placeholder avatar for Bob Smith');
	});
});