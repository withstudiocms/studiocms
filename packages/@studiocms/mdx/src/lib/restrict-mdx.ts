import { getRegistryComponents } from 'studiocms:component-registry/runtime';
import { defaultSchema } from 'rehype-sanitize';
import type { Plugin } from 'unified';

interface AstNode {
	type?: string;
	children?: AstNode[];
	name?: string | null;
	attributes?: AstAttribute[];
	data?: Record<string, unknown>;
}

interface AstAttribute {
	type?: string;
	name?: string;
	value?: unknown;
}

const componentTags = getRegistryComponents().map((component) => component.name.toLowerCase());

const componentAttributes: Record<string, string[]> = getRegistryComponents().reduce(
	(acc, component) => {
		acc[component.name.toLowerCase()] = component.props.map((prop) => prop.name);
		return acc;
	},
	{} as Record<string, string[]>
);

export const studiocmsSchema: typeof defaultSchema = {
	...defaultSchema,
	tagNames: [...(defaultSchema.tagNames ?? []), ...componentTags],
	protocols: {
		cite: [...(defaultSchema.protocols?.cite ?? []), 'storage-file'],
		href: [...(defaultSchema.protocols?.href ?? []), 'storage-file'],
		longDesc: [...(defaultSchema.protocols?.longDesc ?? []), 'storage-file'],
		src: [...(defaultSchema.protocols?.src ?? []), 'storage-file'],
		poster: [...(defaultSchema.protocols?.poster ?? []), 'storage-file'],
		'data-src': [...(defaultSchema.protocols?.['data-src'] ?? []), 'storage-file'],
	},
	attributes: {
		...defaultSchema.attributes,
		...componentAttributes,
		span: [...(defaultSchema.attributes?.span ?? []), ['className', /^hljs-/]],
	},
};

const forbiddenNodeTypes = new Set(['mdxjsEsm', 'mdxFlowExpression', 'mdxTextExpression']);
const safeHtmlTags = new Set(studiocmsSchema.tagNames ?? []);
const safeGlobalAttributes = new Set(['class', 'className', 'id', 'lang', 'dir', 'role', 'title']);

const isSafeUrl = (attributeName: string, value: string): boolean => {
	// biome-ignore lint/suspicious/noControlCharactersInRegex: yes we know, we want to remove control characters from the URL before checking the scheme
	const compactValue = value.replace(/[\u0000-\u0020\u007f]/g, '');
	const scheme = /^([a-z][a-z\d+.-]*):/i.exec(compactValue)?.[1]?.toLowerCase();
	if (!scheme) return true;

	const allowedSchemes = studiocmsSchema.protocols?.[attributeName] ?? [];
	return allowedSchemes.includes(scheme);
};

const validateHtmlElement = (node: AstNode): void => {
	if (!node.name || !safeHtmlTags.has(node.name)) {
		throw new Error(`Unsupported MDX element: ${node.name ?? 'fragment'}`);
	}

	const rules = [
		...(studiocmsSchema.attributes?.['*'] ?? []),
		...(studiocmsSchema.attributes?.[node.name] ?? []),
	];

	for (const attribute of node.attributes ?? []) {
		if (
			attribute.type !== 'mdxJsxAttribute' ||
			!attribute.name ||
			!(typeof attribute.value === 'string' || attribute.value == null)
		) {
			throw new Error('Unsupported MDX attribute: only static HTML attributes are allowed.');
		}

		const name = attribute.name;
		const rule = rules.find((candidate) =>
			typeof candidate === 'string' ? candidate === name : candidate[0] === name
		);
		const isAriaOrData = /^(aria-[a-z\d-]+|data-[a-z\d-]+)$/i.test(name);
		if (!rule && !safeGlobalAttributes.has(name) && !isAriaOrData) {
			throw new Error(`Unsupported MDX HTML attribute: ${name}`);
		}

		if (Array.isArray(rule) && rule.length > 1) {
			const value = attribute.value == null ? true : attribute.value;
			const allowed = rule
				.slice(1)
				.some((allowedValue) =>
					allowedValue instanceof RegExp && typeof value === 'string'
						? allowedValue.test(value)
						: allowedValue === value
				);
			if (!allowed) {
				throw new Error(`Unsupported value for MDX HTML attribute: ${name}`);
			}
		}

		if (name === 'class' || name === 'className') {
			if (typeof attribute.value === 'string' && !/^[\w\s-]*$/.test(attribute.value)) {
				throw new Error(`Unsupported value for MDX HTML attribute: ${name}`);
			}
		}

		if (
			['href', 'src', 'cite', 'longDesc', 'action', 'formAction', 'useMap'].includes(name) &&
			typeof attribute.value === 'string' &&
			!isSafeUrl(name, attribute.value)
		) {
			throw new Error(`Unsafe URL in MDX HTML attribute: ${name}`);
		}
	}
};

/**
 * Restrict MDX input to Markdown syntax. MDX expressions, module declarations,
 * and JSX are rejected so source content cannot provide executable JavaScript.
 */
export const assertSafeMdxTree = (tree: unknown): void => {
	const visit = (node: AstNode): void => {
		if (node.type && forbiddenNodeTypes.has(node.type)) {
			throw new Error(`Unsupported MDX syntax: ${node.type}`);
		}
		if (node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') {
			validateHtmlElement(node);
		}

		for (const child of node.children ?? []) {
			visit(child);
		}
	};

	visit(tree as AstNode);
};

const toHastPropertyName = (name: string): string => {
	if (name === 'class') return 'className';
	return name.replace(
		/^(aria|data)-([a-z\d-]+)$/i,
		(_match, prefix: string, rest: string) =>
			`${prefix.toLowerCase()}${rest.replace(/-([a-z\d])/gi, (_m, char: string) => char.toUpperCase()).replace(/^./, (char) => char.toUpperCase())}`
	);
};

// Validated JSX is rewritten so remark-rehype emits plain elements for rehype-sanitize to process.
const convertJsxToElements = (node: AstNode): void => {
	if (node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') {
		const properties: Record<string, unknown> = {};
		for (const attribute of node.attributes ?? []) {
			const name = toHastPropertyName(attribute.name as string);
			const value = attribute.value == null ? true : attribute.value;
			properties[name] =
				name === 'className' && typeof value === 'string'
					? value.split(/\s+/).filter(Boolean)
					: value;
		}

		node.data = { ...node.data, hName: node.name, hProperties: properties };
		node.type = 'mdxIntrinsicElement';
	}

	for (const child of node.children ?? []) {
		convertJsxToElements(child);
	}
};

export const restrictMdx: Plugin = () => (tree) => {
	assertSafeMdxTree(tree);
	convertJsxToElements(tree as AstNode);
};
