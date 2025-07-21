import { Effect } from 'effect';
import { Project, SyntaxKind } from 'ts-morph';
import { ComponentRegistryError, FileParseError } from './errors.js';
import type { AstroComponentProp, AstroComponentProps } from './types.js';

/**
 * Service for parsing component props from TypeScript source code and extracting prop definitions from Astro files.
 *
 * @remarks
 * This service provides two main functionalities:
 * - `parseComponentProps`: Parses TypeScript interfaces and type aliases from source code to extract component prop definitions, including their names, types, optionality, descriptions, and default values (from JSDoc).
 * - `extractPropsFromAstroFile`: Extracts the `Props` interface or type definition from the frontmatter of an Astro file.
 *
 * @example
 * ```typescript
 * const props = yield* PropsParser.parseComponentProps(sourceCode);
 * ```
 *
 * @example
 * ```typescript
 * const propsSource = yield* PropsParser.extractPropsFromAstroFile(astroFileContent);
 * ```
 *
 * @service
 */
export class PropsParser extends Effect.Service<PropsParser>()('PropsParser', {
	effect: Effect.gen(function* () {
		return {
			parseComponentProps: (sourceCode: string) =>
				Effect.try({
					try: () => {
						const project = new Project();
						const sourceFile = project.createSourceFile('temp.ts', sourceCode);
						const results: AstroComponentProps[] = [];

						// Parse interfaces
						const interfaces = sourceFile.getInterfaces();
						for (const interfaceDecl of interfaces) {
							const interfaceName = interfaceDecl.getName();
							const props: AstroComponentProp[] = [];

							for (const property of interfaceDecl.getProperties()) {
								const propName = property.getName();
								const propType = property.getTypeNode()?.getText() || 'unknown';
								const isOptional = property.hasQuestionToken();

								const jsDocComment = property.getJsDocs()[0];
								let description: string | undefined;
								let defaultValue: string | undefined;

								if (jsDocComment) {
									description = jsDocComment.getDescription().trim();
									const jsDocTags = property.getJsDocs().flatMap((doc) => doc.getTags());
									const defaultTag = jsDocTags.find((tag) => tag.getTagName() === 'default');
									if (defaultTag) {
										defaultValue = defaultTag.getCommentText();
									}
								}

								props.push({
									name: propName,
									type: propType,
									optional: isOptional,
									description,
									defaultValue,
								});
							}

							results.push({ name: interfaceName, props });
						}

						// Parse type aliases
						const typeAliases = sourceFile.getTypeAliases();
						for (const typeAlias of typeAliases) {
							const typeName = typeAlias.getName();
							const typeNode = typeAlias.getTypeNode();

							if (typeNode && typeNode.getKind() === SyntaxKind.TypeLiteral) {
								const props: AstroComponentProp[] = [];
								const typeLiteral = typeNode.asKindOrThrow(SyntaxKind.TypeLiteral);

								for (const property of typeLiteral.getProperties()) {
									if (property.getKind() === SyntaxKind.PropertySignature) {
										const propSig = property.asKindOrThrow(SyntaxKind.PropertySignature);

										const propName = propSig.getName();
										const propType = propSig.getTypeNode()?.getText() || 'unknown';
										const isOptional = propSig.hasQuestionToken();

										const jsDocComment = propSig.getJsDocs()[0];
										let description: string | undefined;
										let defaultValue: string | undefined;

										if (jsDocComment) {
											description = jsDocComment.getDescription().trim();
											const jsDocTags = propSig.getJsDocs().flatMap((doc) => doc.getTags());
											const defaultTag = jsDocTags.find((tag) => tag.getTagName() === 'default');
											if (defaultTag) {
												defaultValue = defaultTag.getCommentText();
											}
										}

										props.push({
											name: propName,
											type: propType,
											optional: isOptional,
											description,
											defaultValue,
										});
									}
								}

								results.push({ name: typeName, props });
							}
						}

						return results;
					},
					catch: (error) =>
						new ComponentRegistryError({
							message: 'Failed to parse component props',
							cause: error,
						}),
				}),

			extractPropsFromAstroFile: (astroFileContent: string) =>
				Effect.try({
					try: () => {
						const frontmatterMatch = astroFileContent.match(/^---\s*\n([\s\S]*?)\n---/m);
						if (!frontmatterMatch) {
							throw new Error('No frontmatter found in Astro file');
						}

						const frontmatter = frontmatterMatch[1];
						const propsMatch = frontmatter.match(
							/((?:export\s+)?(?:interface|type)\s+Props[\s\S]*?(?=\n(?:interface|type|const|let|var|export|$)|$))/m
						);

						if (!propsMatch) {
							throw new Error('No Props interface or type found in frontmatter');
						}

						return propsMatch[0].replace(/^export\s+/, '');
					},
					catch: (error) =>
						new FileParseError({
							filePath: 'astro-content',
							message:
								error instanceof Error ? error.message : 'Failed to extract props from Astro file',
							cause: error,
						}),
				}),
		};
	}),
}) {}
