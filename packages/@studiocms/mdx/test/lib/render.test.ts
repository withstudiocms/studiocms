import * as allure from 'allure-js-commons';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { renderMDX } from '../../src/lib/render.js';
import { assertSafeMdxTree, restrictMdx } from '../../src/lib/restrict-mdx.js';
import { parentSuiteName, sharedTags } from '../test-utils.js';

interface MockReactElement {
	type: unknown;
	props: Record<string, unknown>;
}

const defaultCompiledCode = `
	const { jsx: _jsx } = arguments[0];
	function MDXContent(props = {}) {
		return _jsx('p', { ...props, children: 'Rendered output' });
	}
	return { default: MDXContent };
`;

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
vi.mock('rehype-sanitize', () => ({
	default: vi.fn(),
	defaultSchema: { attributes: { span: [] } },
}));
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

	test('compiles function-body output and renders its default module export', async () => {
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

	test.each(['mdxjsEsm', 'mdxFlowExpression', 'mdxTextExpression'])(
		'rejects executable MDX syntax: %s',
		async (nodeType) => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('MDX Security Tests');
			await allure.tags(...sharedTags);

			expect(() => assertSafeMdxTree({ type: 'root', children: [{ type: nodeType }] })).toThrow(
				`Unsupported MDX syntax: ${nodeType}`
			);
		}
	);

	test('allows ordinary Markdown syntax', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('MDX Security Tests');
		await allure.tags(...sharedTags);

		expect(() =>
			assertSafeMdxTree({
				type: 'root',
				children: [{ type: 'heading', children: [{ type: 'text' }] }],
			})
		).not.toThrow();
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
		const remarkPluginOptions = options.remarkPlugins;
		const rehypePluginOptions = options.rehypePlugins;
		if (!remarkPluginOptions || !rehypePluginOptions) {
			throw new Error('compile was not called with plugin options');
		}
		expect(remarkPluginOptions).toHaveLength(2);
		expect(rehypePluginOptions).toHaveLength(2);
		expect(remarkPluginOptions.at(-1)).toBe(restrictMdx);
		const { default: rehypeSanitize } = await import('rehype-sanitize');
		const sanitizer = rehypePluginOptions.at(-1);
		expect(Array.isArray(sanitizer) && sanitizer[0]).toBe(rehypeSanitize);
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
			toString: () => 'return { default: undefined };',
		} as never);

		await expect(renderMDX('test')).rejects.toThrow(
			'Invalid MDX content: compiler output did not provide a default component.'
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
