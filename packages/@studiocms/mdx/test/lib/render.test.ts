import * as allure from 'allure-js-commons';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { renderMDX } from '../../src/lib/render.js';
import { parentSuiteName, sharedTags } from '../test-utils.js';

interface MockReactElement {
	type: unknown;
	props: Record<string, unknown>;
}

const defaultCompiledCode = 'exports.default = function MDXContent() {};';

vi.mock('@mdx-js/mdx', () => ({
	compile: vi.fn(),
}));

vi.mock('react', () => ({
	createElement: vi.fn(
		(type: unknown, props: Record<string, unknown> = {}): MockReactElement => ({
			type,
			props,
		})
	),
}));

vi.mock('react-dom/server', () => ({
	renderToString: vi.fn(() => '<p>Rendered output</p>'),
}));

vi.mock('rehype-highlight', () => ({ default: vi.fn() }));
vi.mock('remark-gfm', () => ({ default: vi.fn() }));

vi.mock('../../src/lib/shared.js', () => ({
	shared: {
		mdxConfig: {
			remarkPlugins: [],
			rehypePlugins: [],
			recmaPlugins: [],
			remarkRehypeOptions: {},
		},
	},
}));

const localSuiteName = 'renderMDX Function Tests';

describe(parentSuiteName, () => {
	beforeEach(async () => {
		vi.clearAllMocks();
		const { compile } = await import('@mdx-js/mdx');
		vi.mocked(compile).mockResolvedValue({ toString: () => defaultCompiledCode } as never);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	test('compiles content and renders the isolated MDX component', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('MDX Rendering Tests');
		await allure.tags(...sharedTags);

		const { compile } = await import('@mdx-js/mdx');
		const { createElement } = await import('react');
		const { renderToString } = await import('react-dom/server');
		const content = '# Hello World';

		const result = await renderMDX(content);

		expect(compile).toHaveBeenCalledWith(
			content,
			expect.objectContaining({
				outputFormat: 'function-body',
				remarkPlugins: expect.any(Array),
				rehypePlugins: expect.any(Array),
				recmaPlugins: expect.any(Array),
				remarkRehypeOptions: expect.any(Object),
			})
		);
		expect(createElement).toHaveBeenCalledWith(expect.any(Function));
		expect(renderToString).toHaveBeenCalled();
		expect(result).toBe('<p>Rendered output</p>');
	});

	test('passes JSX content unchanged to the compiler', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('MDX Rendering Tests');
		await allure.tags(...sharedTags);

		const { compile } = await import('@mdx-js/mdx');
		const content = '# Hello World\n\n<Button>Click me!</Button>';

		await renderMDX(content);

		expect(compile).toHaveBeenCalledWith(content, expect.any(Object));
	});

	test('passes empty content to the compiler', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('MDX Rendering Tests');
		await allure.tags(...sharedTags);

		const { compile } = await import('@mdx-js/mdx');

		await renderMDX('');

		expect(compile).toHaveBeenCalledWith('', expect.any(Object));
	});

	test('includes the base remark and rehype plugins', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('MDX Rendering Tests');
		await allure.tags(...sharedTags);

		const { compile } = await import('@mdx-js/mdx');

		await renderMDX('test');

		const options = vi.mocked(compile).mock.calls[0]?.[1];
		if (!options) throw new Error('compile was not called with options');
		expect(options.remarkPlugins).toHaveLength(1);
		expect(options.rehypePlugins).toHaveLength(1);
	});

	test('uses the shared MDX plugin configuration', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('MDX Rendering Tests');
		await allure.tags(...sharedTags);

		const { compile } = await import('@mdx-js/mdx');

		await renderMDX('test');

		const options = vi.mocked(compile).mock.calls[0]?.[1];
		if (!options) throw new Error('compile was not called with options');
		expect(options.recmaPlugins).toEqual([]);
		expect(options.remarkRehypeOptions).toEqual({});
	});

	test('propagates MDX compilation errors', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('MDX Rendering Tests');
		await allure.tags(...sharedTags);

		const { compile } = await import('@mdx-js/mdx');
		const error = new Error('Malformed MDX');
		vi.mocked(compile).mockRejectedValueOnce(error);

		await expect(renderMDX('<UnclosedTag>')).rejects.toBe(error);
	});

	test('rejects compiled output without a default component', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('MDX Rendering Tests');
		await allure.tags(...sharedTags);

		const { compile } = await import('@mdx-js/mdx');
		vi.mocked(compile).mockResolvedValueOnce({
			toString: () => 'exports.default = undefined;',
		} as never);

		await expect(renderMDX('test')).rejects.toThrow(
			'Invalid MDX Content payload produced during isolation runtime.'
		);
	});

	test('passes Unicode and special characters unchanged to the compiler', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('MDX Rendering Tests');
		await allure.tags(...sharedTags);

		const { compile } = await import('@mdx-js/mdx');
		const content = `# Hello 🌎\n\nSpecial chars: <>&"'`;

		await renderMDX(content);

		expect(compile).toHaveBeenCalledWith(content, expect.any(Object));
	});
});
