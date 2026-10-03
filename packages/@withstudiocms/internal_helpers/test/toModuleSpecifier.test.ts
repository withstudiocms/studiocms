import * as allure from 'allure-js-commons';
import { describe, expect, test } from 'vitest';
import { toModuleSpecifier } from '../src/toModuleSpecifier.js';
import { parentSuiteName, sharedTags } from './test-utils.js';

const localSuiteName = 'toModuleSpecifier Tests (OS-independent)';

describe(parentSuiteName, () => {
	test('JSON-quotes and POSIX-normalizes Windows-style paths', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('JSON-quotes and POSIX-normalizes Windows-style paths');
		await allure.tags(...sharedTags);

		const windowsStyle = 'E:\\AI Projects\\node_modules\\studiocms\\dist\\utils\\safeString.js';
		const specifier = toModuleSpecifier(windowsStyle);

		expect(specifier).toBe(
			JSON.stringify('E:/AI Projects/node_modules/studiocms/dist/utils/safeString.js')
		);
		expect(specifier.startsWith('"')).toBe(true);
		expect(specifier).not.toContain('\\u');
	});

	test('escapes backslash sequences that would be JS escapes if unquoted', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('escapes backslash sequences that would be JS escapes if unquoted');
		await allure.tags(...sharedTags);

		const windowsStyle = 'E:\\node_modules\\pkg\\utils\\file.js';
		const specifier = toModuleSpecifier(windowsStyle);
		const embedded = `from ${specifier}`;

		expect(embedded).toBe('from "E:/node_modules/pkg/utils/file.js"');
		expect(embedded).not.toMatch(/\\[unt]/);
	});

	test('JSON.stringify alone would escape; POSIX form matches Vite module ids', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('JSON.stringify alone would escape; POSIX form matches Vite module ids');
		await allure.tags(...sharedTags);

		const raw = 'C:\\Users\\test\\file.js';
		expect(JSON.stringify(raw)).toBe('"C:\\\\Users\\\\test\\\\file.js"');
		expect(toModuleSpecifier(raw)).toBe('"C:/Users/test/file.js"');
	});

	test('URL inputs use href as the module specifier', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('URL inputs use href as the module specifier');
		await allure.tags(...sharedTags);

		const fileUrl = new URL('file:///E:/AI%20Projects/pkg/service.js');
		expect(toModuleSpecifier(fileUrl)).toBe(JSON.stringify(fileUrl.href));
	});
});
