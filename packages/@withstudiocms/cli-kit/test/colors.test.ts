/** biome-ignore-all lint/suspicious/noControlCharactersInRegex: Allowed in tests */

import * as allure from 'allure-js-commons';
import { describe, expect, test } from 'vitest';
import {
	StudioCMSColorway,
	StudioCMSColorwayBg,
	StudioCMSColorwayError,
	StudioCMSColorwayErrorBg,
	StudioCMSColorwayInfo,
	StudioCMSColorwayInfoBg,
	StudioCMSColorwayWarn,
	StudioCMSColorwayWarnBg,
	styleTextBgHex,
	styleTextHex,
	TursoColorway,
} from '../src/colors';
import { parentSuiteName, sharedTags } from './test-utils.js';

const localSuiteName = 'Colors Utility Tests';

describe(parentSuiteName, () => {
	[
		{
			name: 'should style text with foreground hex color',
			hexColor: '#FF0000' as const,
			text: 'Hello',
			expected: '\x1b[38;2;255;0;0mHello\x1b[0m',
		},
		{
			name: 'should style text with different hex color',
			hexColor: '#0000FF' as const,
			text: 'World',
			expected: '\x1b[38;2;0;0;255mWorld\x1b[0m',
		},
	].forEach(({ name, hexColor, text, expected }) => {
		test(`styleTextHex - ${name}`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('styleTextHex Tests');
			await allure.tags(...sharedTags);

			await allure.step('Styling text with hex color', async (ctx) => {
				await ctx.parameter('Hex Color', hexColor);
				await ctx.parameter('Text', text);

				const styler = styleTextHex(hexColor);
				const result = styler(text);

				await ctx.parameter('Result', result);

				expect(result).toBe(expected);
			});
		});
	});

	[
		{
			name: 'should style text with background hex color',
			hexColor: '#FF0000' as const,
			text: 'Hello World',
			expected: '\x1b[48;2;255;0;0mHello World\x1b[0m',
		},
		{
			name: 'should style text with different background hex color',
			hexColor: '#0000FF' as const,
			text: 'Test',
			expected: '\x1b[48;2;0;0;255mTest\x1b[0m',
		},
	].forEach(({ name, hexColor, text, expected }) => {
		test(`styleTextBgHex - ${name}`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('styleTextBgHex Tests');
			await allure.tags(...sharedTags);

			await allure.step('Styling text with background hex color', async (ctx) => {
				await ctx.parameter('Hex Color', hexColor);
				await ctx.parameter('Text', text);

				const styler = styleTextBgHex(hexColor);
				const result = styler(text);

				await ctx.parameter('Result', result);

				expect(result).toBe(expected);
			});
		});
	});

	[
		{
			name: 'should apply StudioCMS primary color',
			func: StudioCMSColorway,
			text: 'Text',
			matcher: /\x1b\[38;2;\d+;\d+;\d+m/,
		},
		{
			name: 'should apply StudioCMS primary background color',
			func: StudioCMSColorwayBg,
			text: 'Text',
			matcher: /\x1b\[48;2;\d+;\d+;\d+m/,
		},
		{
			name: 'should apply StudioCMS info color',
			func: StudioCMSColorwayInfo,
			text: 'Info',
			matcher: /\x1b\[38;2;\d+;\d+;\d+m/,
		},
		{
			name: 'should apply StudioCMS info background color',
			func: StudioCMSColorwayInfoBg,
			text: 'Info',
			matcher: /\x1b\[48;2;\d+;\d+;\d+m/,
		},
		{
			name: 'should apply StudioCMS warn color',
			func: StudioCMSColorwayWarn,
			text: 'Warning',
			matcher: /\x1b\[38;2;\d+;\d+;\d+m/,
		},
		{
			name: 'should apply StudioCMS warn background color',
			func: StudioCMSColorwayWarnBg,
			text: 'Warning',
			matcher: /\x1b\[48;2;\d+;\d+;\d+m/,
		},
		{
			name: 'should apply StudioCMS error color',
			func: StudioCMSColorwayError,
			text: 'Error',
			matcher: /\x1b\[38;2;\d+;\d+;\d+m/,
		},
		{
			name: 'should apply StudioCMS error background color',
			func: StudioCMSColorwayErrorBg,
			text: 'Error',
			matcher: /\x1b\[48;2;\d+;\d+;\d+m/,
		},
		{
			name: 'should apply Turso background color',
			func: TursoColorway,
			text: 'Turso',
			matcher: /\x1b\[48;2;\d+;\d+;\d+m/,
		},
	].forEach(({ name, func, text, matcher }) => {
		test(`Colorway - ${name}`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('StudioCMS Color Functions Tests');
			await allure.tags(...sharedTags);

			await allure.step('Applying color function to text', async (ctx) => {
				await ctx.parameter('Text', text);

				const result = func(text);

				await ctx.parameter('Result', result);

				expect(result).toContain(text);
				expect(result).toMatch(matcher);
			});
		});
	});
});
