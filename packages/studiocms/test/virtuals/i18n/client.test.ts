// @vitest-environment jsdom
import { beforeEach, describe, expect } from 'vitest';
import {
	baseTranslation,
	documentUpdater,
	makeTranslation,
	pageHeaderUpdater,
	updateElmLabel,
	updateElmPlaceholder,
	updateSelectElmLabel,
	updateToggleElmLabel,
} from '../../../src/virtuals/i18n/client';
import { allureTester } from '../../fixtures/allureTester';
import { parentSuiteName, sharedTags } from '../../test-utils';

const localSuiteName = 'i18n Client Virtuals tests';

describe(parentSuiteName, () => {
	const test = allureTester({
		suiteName: localSuiteName,
		suiteParentName: parentSuiteName,
	});

	test('makeTranslation - updates text content when translation changes', async ({
		setupAllure,
		step,
	}) => {
		await setupAllure({
			subSuiteName: 'makeTranslation tests',
			tags: [...sharedTags, 'virtual:i18n', 'function:makeTranslation'],
		});

		await step('Creating translation element and updating text', async () => {
			const key = Object.keys(baseTranslation)[0] as keyof typeof baseTranslation;
			const messages = {
				subscribe: (fn: (comp: any) => void) => fn({ [key]: 'Translated Text' }),
			};
			// @ts-expect-error mocking messages
			const Translation = makeTranslation(key, messages);
			customElements.define('test-translation', Translation);
			const el = document.createElement('test-translation');
			el.setAttribute('key', key as string);
			document.body.appendChild(el);
			expect(el.innerText).toBe('Translated Text');
		});
	});
});

describe(parentSuiteName, () => {
	const test = allureTester({
		suiteName: localSuiteName,
		suiteParentName: parentSuiteName,
	});

	beforeEach(() => {
		document.body.innerHTML = `
            <meta name="description" content="">
        `;
		document.title = '';
		document.documentElement.lang = '';
	});

	test('updates document title, meta description, and lang', async ({ setupAllure, step }) => {
		await setupAllure({
			subSuiteName: 'documentUpdater tests',
			tags: [...sharedTags, 'virtual:i18n', 'function:documentUpdater'],
		});

		await step('Updating document properties', async () => {
			const comp = { title: 'My Title', description: 'My Description' };
			documentUpdater(comp, 'fr');
			expect(document.title).toBe('My Title');
			expect(document.querySelector('meta[name="description"]')?.getAttribute('content')).toBe(
				'My Description'
			);
			expect(document.documentElement.lang).toBe('fr');
		});
	});
});

describe(parentSuiteName, () => {
	const test = allureTester({
		suiteName: localSuiteName,
		suiteParentName: parentSuiteName,
	});

	beforeEach(() => {
		document.body.innerHTML = `
            <label for="foo"><span class="label">Old Label</span></label>
            <label for="bar"><span class="label">Old Label <span class="req-star">*</span></span></label>
        `;
	});

	[
		{
			el: 'foo',
			translation: 'New Label',
			querySelector: 'label[for="foo"] .label',
			expected: 'New Label',
		},
		{
			el: 'bar',
			translation: 'Required Label',
			querySelector: 'label[for="bar"] .label',
			expected: 'Required Label <span class="req-star">*</span>',
		},
	].forEach(({ el, translation, querySelector, expected }) => {
		const testName = `updateElmLabel updates label for "${el}" correctly`;
		const tags = [...sharedTags, 'virtual:i18n', 'function:updateElmLabel'];

		test(testName, async ({ setupAllure, step }) => {
			await setupAllure({
				subSuiteName: 'updateElmLabel tests',
				tags: [...tags],
				parameters: {
					elementId: el,
					translation,
				},
			});

			await step(`Updating label for element "${el}"`, async () => {
				updateElmLabel(el, translation);
				const label = document.querySelector(querySelector) as HTMLSpanElement;
				expect(label.innerHTML).toBe(expected);
			});
		});
	});
});

describe(parentSuiteName, () => {
	const test = allureTester({
		suiteName: localSuiteName,
		suiteParentName: parentSuiteName,
	});

	beforeEach(() => {
		document.body.innerHTML = `<input id="baz" placeholder="Old Placeholder">`;
	});

	test('updateElmPlaceholder updates input placeholder', async ({ setupAllure, step }) => {
		await setupAllure({
			subSuiteName: 'updateElmPlaceholder tests',
			tags: [...sharedTags, 'virtual:i18n', 'function:updateElmPlaceholder'],
			parameters: {
				elementId: 'baz',
				newPlaceholder: 'New Placeholder',
			},
		});

		await step('Updating input placeholder', async () => {
			updateElmPlaceholder('baz', 'New Placeholder');
			// biome-ignore lint/style/noNonNullAssertion: allowed for tests
			const input = document.querySelector<HTMLInputElement>('#baz')!;
			expect(input.placeholder).toBe('New Placeholder');
		});
	});
});

describe(parentSuiteName, () => {
	const test = allureTester({
		suiteName: localSuiteName,
		suiteParentName: parentSuiteName,
	});

	beforeEach(() => {
		document.body.innerHTML = `
            <label for="qux-select-btn">Old Select Label</label>
            <label for="quux-select-btn">Old Select Label <span class="req-star">*</span></label>
        `;
	});

	[
		{
			el: 'qux',
			translation: 'New Select Label',
			querySelector: 'label[for="qux-select-btn"]',
			expected: 'New Select Label',
		},
		{
			el: 'quux',
			translation: 'Required Select Label',
			querySelector: 'label[for="quux-select-btn"]',
			expected: 'Required Select Label <span class="req-star">*</span>',
		},
	].forEach(({ el, translation, querySelector, expected }) => {
		const testName = `updateSelectElmLabel updates select label for "${el}" correctly`;
		const tags = [...sharedTags, 'virtual:i18n', 'function:updateSelectElmLabel'];

		test(testName, async ({ setupAllure, step }) => {
			await setupAllure({
				subSuiteName: 'updateSelectElmLabel tests',
				tags: [...tags],
				parameters: {
					elementId: el,
					translation,
				},
			});

			await step(`Updating select label for element "${el}"`, async () => {
				updateSelectElmLabel(el, translation);
				const label = document.querySelector(querySelector) as HTMLLabelElement;
				expect(label.innerHTML).toBe(expected);
			});
		});
	});
});

describe(parentSuiteName, () => {
	const test = allureTester({
		suiteName: localSuiteName,
		suiteParentName: parentSuiteName,
	});

	beforeEach(() => {
		document.body.innerHTML = `
            <label for="toggle1"><span id="label-toggle1">Old Toggle Label</span></label>
            <label for="toggle2"><span id="label-toggle2">Old Toggle Label <span class="req-star">*</span></span></label>
        `;
	});

	[
		{
			el: 'toggle1',
			translation: 'New Toggle Label',
			querySelector: '#label-toggle1',
			expected: 'New Toggle Label',
		},
		{
			el: 'toggle2',
			translation: 'Required Toggle Label',
			querySelector: '#label-toggle2',
			expected: 'Required Toggle Label <span class="req-star">*</span>',
		},
	].forEach(({ el, translation, querySelector, expected }) => {
		const testName = `updateToggleElmLabel updates toggle label for "${el}" correctly`;
		const tags = [...sharedTags, 'virtual:i18n', 'function:updateToggleElmLabel'];

		test(testName, async ({ setupAllure, step }) => {
			await setupAllure({
				subSuiteName: 'updateToggleElmLabel tests',
				tags: [...tags],
				parameters: {
					elementId: el,
					translation,
				},
			});

			await step(`Updating toggle label for element "${el}"`, async () => {
				updateToggleElmLabel(el, translation);
				const label = document.querySelector(querySelector) as HTMLSpanElement;
				expect(label.innerHTML).toBe(expected);
			});
		});
	});
});

describe(parentSuiteName, () => {
	const test = allureTester({
		suiteName: localSuiteName,
		suiteParentName: parentSuiteName,
	});

	beforeEach(() => {
		document.body.innerHTML = `
            <div class="page-header">
                <span class="page-title">Old Title</span>
            </div>
        `;
	});

	test('pageHeaderUpdater updates page header title', async ({ setupAllure, step }) => {
		await setupAllure({
			subSuiteName: 'pageHeaderUpdater tests',
			tags: [...[...sharedTags, 'virtual:i18n', 'function:pageHeaderUpdater']],
			parameters: {
				newTitle: 'New Page Title',
			},
		});

		await step('Updating page header title', async () => {
			pageHeaderUpdater('New Page Title');
			const header = document.querySelector('.page-header .page-title') as HTMLElement;
			expect(header.textContent).toBe('New Page Title');
		});
	});
});
