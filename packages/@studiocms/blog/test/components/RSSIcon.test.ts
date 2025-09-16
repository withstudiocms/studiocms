/// <reference types="astro/client" />
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, test } from 'vitest';
import RSSIcon from '../../src/components/RSSIcon.astro';

describe('RSSIcon component', () => {
	test('RSSIcon renders correctly', async () => {
		const container = await AstroContainer.create();
		const result = await container.renderToString(RSSIcon);

		expect(result).toMatch(
			/<svg xmlns="http:\/\/www.w3.org\/2000\/svg" width="32" height="32" viewBox="0 0 24 24".*?>/
		);
		expect(result).toMatch(
			/<path fill="currentColor" d="M6.18 15.64a2.18 2.18 0 0 1 2.18 2.18C8.36 19 7.38 20 6.18 20C5 20 4 19 4 17.82a2.18 2.18 0 0 1 2.18-2.18M4 4.44A15.56 15.56 0 0 1 19.56 20h-2.83A12.73 12.73 0 0 0 4 7.27zm0 5.66a9.9 9.9 0 0 1 9.9 9.9h-2.83A7.07 7.07 0 0 0 4 12.93z".*?><\/path>/
		);
		expect(result).toMatch(/<\/svg>/);
	});
});
