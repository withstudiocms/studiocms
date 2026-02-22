/** biome-ignore-all lint/suspicious/noExplicitAny: Frontmatter values can be dynamic */
import type { Expression, Super } from 'estree';
import Slugger from 'github-slugger';
import type { MdxTextExpression } from 'mdast-util-mdx-expression';
import type { Node } from 'unist';
import { visit } from 'unist-util-visit';
import type { VFile } from 'vfile';
import type { MarkdownHeading, RehypePlugin } from '../../types.ts';

const rawNodeTypes = new Set(['text', 'raw', 'mdxTextExpression']);
const codeTagNames = new Set(['code', 'pre']);

/**
 * A rehype plugin that collects headings from a Markdown or MDX file and assigns unique IDs to them.
 * The collected headings are stored in the file's `astro` data property.
 *
 * @returns A function that processes the syntax tree and file data.
 *
 * The function performs the following steps:
 * 1. Initializes an empty array to store headings and retrieves the frontmatter and file type.
 * 2. Traverses the syntax tree to find heading elements (`h1` to `h6`).
 * 3. Extracts the text content from each heading, handling raw nodes and MDX expressions.
 * 4. Generates a unique slug for each heading and assigns it as the `id` property.
 * 5. Stores the collected headings in the file's `astro.headings` property.
 */
export function rehypeHeadingIds({
	experimentalHeadingIdCompat,
}: {
	experimentalHeadingIdCompat?: boolean;
} = {}): ReturnType<RehypePlugin> {
	return (tree, file) => {
		const headings: MarkdownHeading[] = [];
		const frontmatter = file.data.astro?.frontmatter;
		const slugger = new Slugger();
		const isMDX = isMDXFile(file);
		visit(tree, (node) => {
			if (node.type !== 'element') return;
			const { tagName } = node;
			if (tagName[0] !== 'h') return;
			const [, level] = /h([0-6])/.exec(tagName) ?? [];
			if (!level) return;
			const depth = Number.parseInt(level, 10);

			let text = '';
			visit(node, (child, __, parent) => {
				if (child.type === 'element' || parent == null) {
					return;
				}
				if (child.type === 'raw') {
					if (/^\n?<.*>\n?$/.test(child.value)) {
						return;
					}
				}
				if (rawNodeTypes.has(child.type)) {
					if (isMDX || codeTagNames.has(parent.tagName)) {
						let value = child.value;
						if (isMdxTextExpression(child) && frontmatter) {
							const frontmatterPath = getMdxFrontmatterVariablePath(child);
							if (Array.isArray(frontmatterPath) && frontmatterPath.length > 0) {
								const frontmatterValue = getMdxFrontmatterVariableValue(
									frontmatter,
									frontmatterPath
								);
								if (typeof frontmatterValue === 'string') {
									value = frontmatterValue;
								}
							}
						}
						text += value;
					} else {
						text += child.value.replace(/\{/g, '${');
					}
				}
			});

			node.properties = node.properties || {};
			if (typeof node.properties.id !== 'string') {
				let slug = slugger.slug(text);

				if (!experimentalHeadingIdCompat) {
					if (slug.endsWith('-')) slug = slug.slice(0, -1);
				}

				node.properties.id = slug;
			}

			headings.push({ depth, slug: node.properties.id, text });
		});

		file.data.astro ??= {};
		file.data.astro.headings = headings;
	};
}

function isMDXFile(file: VFile): boolean {
	return Boolean(file.history[0]?.endsWith('.mdx'));
}

/**
 * Check if an ESTree entry is `frontmatter.*.VARIABLE`.
 * If it is, return the variable path (i.e. `["*", ..., "VARIABLE"]`) minus the `frontmatter` prefix.
 */
function getMdxFrontmatterVariablePath(node: MdxTextExpression): string[] | Error {
	if (!node.data?.estree || node.data.estree.body.length !== 1) return new Error();

	const statement = node.data.estree.body[0];

	// Check for "[ANYTHING].[ANYTHING]".
	if (statement?.type !== 'ExpressionStatement' || statement.expression.type !== 'MemberExpression')
		return new Error();

	let expression: Expression | Super = statement.expression;
	const expressionPath: string[] = [];

	// Traverse the expression, collecting the variable path.
	while (
		expression.type === 'MemberExpression' &&
		expression.property.type === (expression.computed ? 'Literal' : 'Identifier')
	) {
		expressionPath.push(
			expression.property.type === 'Literal'
				? String(expression.property.value)
				: expression.property.name
		);

		expression = expression.object;
	}

	// Check for "frontmatter.[ANYTHING]".
	if (expression.type !== 'Identifier' || expression.name !== 'frontmatter') return new Error();

	return expressionPath.reverse();
}

function getMdxFrontmatterVariableValue(
	frontmatter: Record<string, any>,
	path: string[]
): Record<string, any> | undefined {
	let value = frontmatter;

	for (const key of path) {
		if (!value[key]) return undefined;

		value = value[key];
	}

	return value;
}

function isMdxTextExpression(node: Node): node is MdxTextExpression {
	return node.type === 'mdxTextExpression';
}
