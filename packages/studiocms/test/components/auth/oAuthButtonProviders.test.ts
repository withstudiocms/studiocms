import { describe, expect, it } from 'vitest';
import { providerData, showOAuth } from '../../../src/components/auth/oAuthButtonProviders';

describe('oAuthButtonProviders', () => {
	it('should map oAuthButtons to providerData correctly', () => {
		expect(providerData).toEqual([
			{
				enabled: true,
				href: '/studiocms_api/auth/github',
				label: 'GitHub',
				image: 'github.png',
			},
			{
				enabled: false,
				href: '/studiocms_api/auth/discord',
				label: 'Discord',
				image: 'discord.png',
			},
		]);
	});

	it('should set showOAuth to true if any provider is enabled', () => {
		expect(showOAuth).toBe(true);
	});
});
