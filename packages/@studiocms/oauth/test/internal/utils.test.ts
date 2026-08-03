import * as allure from 'allure-js-commons';
import { describe, expect, test } from 'vitest';

import { trimLeft, trimRight } from '../../src/internal/utils.js';
import { parentSuiteName, sharedTags } from '../test-utils.js';

const localSuiteName = 'Utils Internal Tests';

describe(parentSuiteName, () => {
	test('trimLeft()', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('Trim Left');
		await allure.tags(...sharedTags);

		await allure.step('should remove the given leading trim characters', async () => {
			expect(trimLeft(' hello', ' ')).toBe('hello');
			expect(trimLeft('  hello', ' ')).toBe('hello');
			expect(trimLeft('!!!hello', '!')).toBe('hello');
			expect(trimLeft('!!!hello!', '!')).toBe('hello!');
			expect(trimLeft('!!', '!')).toBe('');
			expect(trimLeft('', '!')).toBe('');

			expect(() => trimLeft('hello', '!!')).toThrow(TypeError);
		});
	});

	test('trimRight()', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('Trim Right');
		await allure.tags(...sharedTags);

		await allure.step('should remove the given trailing trim characters', async () => {
			expect(trimRight('hello ', ' ')).toBe('hello');
			expect(trimRight('hello  ', ' ')).toBe('hello');
			expect(trimRight('hello!!!', '!')).toBe('hello');
			expect(trimRight('!hello!!!', '!')).toBe('!hello');
			expect(trimRight('!!', '!')).toBe('');
			expect(trimRight('', '!')).toBe('');

			expect(() => trimLeft('hello', '!!')).toThrow(TypeError);
		});
	});
});
