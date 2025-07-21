import { Effect } from 'effect';
import { Project, SyntaxKind } from 'ts-morph';
import { ComponentRegistryError, FileParseError } from './errors.js';
import type { AstroComponentProp, AstroComponentProps } from './types.js';

/**
 * Service for parsing component props from TypeScript source code and extracting prop definitions from Astro files.
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
						console.log(`Found ${interfaces.length} interfaces`);
						
						for (const interfaceDecl of interfaces) {
							const interfaceName = interfaceDecl.getName();
							console.log(`Processing interface: ${interfaceName}`);
							const props: AstroComponentProp[] = [];

							const properties = interfaceDecl.getProperties();
							console.log(`Interface ${interfaceName} has ${properties.length} properties`);

							for (const property of properties) {
								const propName = property.getName();
								const propType = property.getTypeNode()?.getText() || 'unknown';
								const isOptional = property.hasQuestionToken();

								console.log(`Processing property: ${propName}, type: ${propType}, optional: ${isOptional}`);

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
						console.log(`Found ${typeAliases.length} type aliases`);
						
						for (const typeAlias of typeAliases) {
							const typeName = typeAlias.getName();
							const typeNode = typeAlias.getTypeNode();
							console.log(`Processing type alias: ${typeName}`);

							if (typeNode && typeNode.getKind() === SyntaxKind.TypeLiteral) {
								const props: AstroComponentProp[] = [];
								const typeLiteral = typeNode.asKindOrThrow(SyntaxKind.TypeLiteral);

								const members = typeLiteral.getMembers();
								console.log(`Type literal ${typeName} has ${members.length} members`);

								for (const member of members) {
									console.log(`Member kind: ${member.getKindName()}`);
									
									if (member.getKind() === SyntaxKind.PropertySignature) {
										const propSig = member.asKindOrThrow(SyntaxKind.PropertySignature);

										const propName = propSig.getName();
										const propType = propSig.getTypeNode()?.getText() || 'unknown';
										const isOptional = propSig.hasQuestionToken();

										console.log(`Processing type property: ${propName}, type: ${propType}, optional: ${isOptional}`);

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

								console.log(`Type alias ${typeName} final props:`, props);
								results.push({ name: typeName, props });
							} else {
								console.log(`Type alias ${typeName} is not a type literal, kind: ${typeNode?.getKindName()}`);
							}
						}

						return results;
					},
					catch: (error) => {
						console.error('Error parsing component props:', error);
						return new ComponentRegistryError({
							message: 'Failed to parse component props',
							cause: error,
						});
					}
				}),

			extractPropsFromAstroFile: (astroFileContent: string) =>
				Effect.try({
					try: () => {
						const frontmatterMatch = astroFileContent.match(/^---\s*\n([\s\S]*?)\n---/m);
						if (!frontmatterMatch) {
							throw new Error('No frontmatter found in Astro file');
						}

						const frontmatter = frontmatterMatch[1];
						
						// Look for Props interface with proper brace matching
						const interfaceMatch = frontmatter.match(
							/((?:export\s+)?interface\s+Props\s*\{[\s\S]*?\n\})/m
						);
						
						if (interfaceMatch) {
							const propsDefinition = interfaceMatch[0].replace(/^export\s+/, '');
							return propsDefinition;
						}

						// Look for Props type alias
						const typeMatch = frontmatter.match(
							/((?:export\s+)?type\s+Props\s*=\s*\{[\s\S]*?\n\})/m
						);
						
						if (typeMatch) {
							const propsDefinition = typeMatch[0].replace(/^export\s+/, '');
							return propsDefinition;
						}

						// Fallback: try to find Props with proper brace counting
						const propsStart = frontmatter.search(/(?:export\s+)?(?:interface|type)\s+Props\s*[={]/);
						if (propsStart === -1) {
							throw new Error('No Props interface or type found in frontmatter');
						}

						// Find the complete Props definition by counting braces
						const propsSubstring = frontmatter.substring(propsStart);
						let braceCount = 0;
						let inString = false;
						let stringChar = '';
						let i = 0;
						
						for (i = 0; i < propsSubstring.length; i++) {
							const char = propsSubstring[i];
							const prevChar = i > 0 ? propsSubstring[i - 1] : '';
							
							// Handle string literals
							if ((char === '"' || char === "'" || char === '`') && prevChar !== '\\') {
								if (!inString) {
									inString = true;
									stringChar = char;
								} else if (char === stringChar) {
									inString = false;
									stringChar = '';
								}
							}
							
							if (!inString) {
								if (char === '{') {
									braceCount++;
								} else if (char === '}') {
									braceCount--;
									if (braceCount === 0) {
										break;
									}
								}
							}
						}
						
						const propsDefinition = propsSubstring.substring(0, i + 1).replace(/^export\s+/, '');
						return propsDefinition;
					},
					catch: (error) => {
						console.error('Error extracting props from Astro file:', error);
						return new FileParseError({
							filePath: 'astro-content',
							message:
								error instanceof Error ? error.message : 'Failed to extract props from Astro file',
							cause: error,
						});
					}
				}),
		};
	}),
}) {}