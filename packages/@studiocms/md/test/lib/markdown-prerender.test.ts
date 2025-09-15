import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as markdownPrerender from '../../src/lib/markdown-prerender.js';

// Mock dependencies
vi.mock('studiocms:md/config', () => ({
	default: { flavor: 'studiocms' },
}));
vi.mock('@astrojs/markdown-remark', () => ({
	createMarkdownProcessor: vi.fn(() =>
		Promise.resolve({
			render: vi.fn(async (content: string) => ({ code: `<astro>${content}</astro>` })),
		})
	),
}));
vi.mock('@studiocms/markdown-remark-processor', () => ({
	createMarkdownProcessor: vi.fn(() =>
		Promise.resolve({
			render: vi.fn(async (content: string) => ({ code: `<studiocms>${content}</studiocms>` })),
		})
	),
}));
vi.mock('./shared.js', () => ({
	shared: {
		astroMDRemark: {},
		mdConfig: {
			flavor: 'studiocms',
			autoLinkHeadings: false,
			discordSubtext: false,
			callouts: undefined,
		},
	},
}));

// Import after mocks

describe('preRender', () => {
	beforeEach(() => {
		vi.resetModules();
	});

	it('renders markdown using StudioCMS processor by default', async () => {
		const render = markdownPrerender.preRender();
		const result = await render('Hello **world**');
		expect(result).toBe('<studiocms>Hello **world**</studiocms>');
	});

	it('renders markdown using Astro processor when flavor is astro', async () => {
		// Change flavor to astro
		vi.doMock('studiocms:md/config', () => ({
			default: { flavor: 'astro' },
		}));
		// Re-import to apply new mock
		const { preRender } = await import('../../src/lib/markdown-prerender.js');
		const render = preRender();
		const result = await render('Hello **astro**');
		expect(result).toBe('<astro>Hello **astro**</astro>');
	});

	it('renders markdown using StudioCMS processor for unknown flavor', async () => {
		vi.doMock('studiocms:md/config', () => ({
			default: { flavor: 'unknown' },
		}));
		const { preRender } = await import('../../src/lib/markdown-prerender.js');
		const render = preRender();
		const result = await render('Hello **unknown**');
		expect(result).toBe('<studiocms>Hello **unknown**</studiocms>');
	});
});
