// @ts-check
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { glob } from 'tinyglobby';

/*
  This file updates the snapshots templates in `templates/*` to match the current state of the templates.
  This should be run after updating or adding new templates to ensure the snapshots are up to date.
*/

const rootUrl = new URL('..', import.meta.url);

// Update all templates' package.json
const templateDirs = await glob('templates/*', {
	onlyDirectories: true,
	cwd: fileURLToPath(rootUrl),
});

/**
 * @type {import("../packages/create-studiocms/src/types").TemplateOptions}
 */
const templateSnapshots = [];

for (const templateDir of templateDirs) {
	const packageJsonPath = path.join(templateDir, './package.json');
	const packageJson = await readAndParsePackageJson(packageJsonPath);
	if (!packageJson) continue;

    // Update the template snapshot
    if (packageJson.studiocms_template) {
        templateSnapshots.push({
            value: packageJson.studiocms_template.value,
            label: packageJson.studiocms_template.label,
            hint: packageJson.studiocms_template.hint,
        });
    }
}

// Update the templates.json file in create-studiocms
const createStudiocmsTemplatesJsonPath = new URL(
	'../packages/create-studiocms/src/templates.json',
	import.meta.url,
);
await fs.writeFile(
	createStudiocmsTemplatesJsonPath,
	`${JSON.stringify(templateSnapshots, null, 2)}\n`,
);

/**
 * @param {string} packageJsonPath
 * @returns {Promise<Record<string, any> | undefined>}
 */
async function readAndParsePackageJson(packageJsonPath) {
	try {
		return JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
	} catch {}
}
