#!/usr/bin/env tsx
import * as Fs from 'node:fs/promises';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const getRelativePath = (to: string) => {
	return new URL(to, `file://${__dirname}/`);
};

const jsBundle = await fetch(
	'https://cdn.jsdelivr.net/npm/@scalar/api-reference@latest/dist/browser/standalone.min.js'
).then((res) => res.text());

const source = `/** Auto-generated file. Do not edit. */

/** @internal */
export const javascript = ${JSON.stringify(`${jsBundle}`)}
`;

const pathToFile = getRelativePath('../src/_internal/httpApiScalar.ts');

console.log(`Writing to ${pathToFile}`);

await Fs.writeFile(pathToFile, source);
