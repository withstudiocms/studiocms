// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
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

describe('documentUpdater', () => {
	beforeEach(() => {
		document.body.innerHTML = `
            <meta name="description" content="">
        `;
		document.title = '';
		document.documentElement.lang = '';
	});

	it('updates document title, meta description, and lang', () => {
		const comp = { title: 'My Title', description: 'My Description' };
		documentUpdater(comp, 'fr');
		expect(document.title).toBe('My Title');
		expect(document.querySelector('meta[name="description"]')?.getAttribute('content')).toBe(
			'My Description'
		);
		expect(document.documentElement.lang).toBe('fr');
	});
});

describe('makeTranslation', () => {
	it('updates text content when translation changes', () => {
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

describe('updateElmLabel', () => {
	beforeEach(() => {
		document.body.innerHTML = `
            <label for="foo"><span class="label">Old Label</span></label>
            <label for="bar"><span class="label">Old Label <span class="req-star">*</span></span></label>
        `;
	});

	it('updates label text', () => {
		updateElmLabel('foo', 'New Label');
		const label = document.querySelector('label[for="foo"] .label') as HTMLSpanElement;
		expect(label.textContent).toBe('New Label');
	});

	it('preserves required star in label', () => {
		updateElmLabel('bar', 'Required Label');
		const label = document.querySelector('label[for="bar"] .label') as HTMLSpanElement;
		expect(label.innerHTML).toBe('Required Label <span class="req-star">*</span>');
	});
});

describe('updateElmPlaceholder', () => {
	beforeEach(() => {
		document.body.innerHTML = `<input id="baz" placeholder="Old Placeholder">`;
	});

	it('updates input placeholder', () => {
		updateElmPlaceholder('baz', 'New Placeholder');
		// biome-ignore lint/style/noNonNullAssertion: allowed for tests
		const input = document.querySelector<HTMLInputElement>('#baz')!;
		expect(input.placeholder).toBe('New Placeholder');
	});
});

describe('updateSelectElmLabel', () => {
	beforeEach(() => {
		document.body.innerHTML = `
            <label for="qux-select-btn">Old Select Label</label>
            <label for="quux-select-btn">Old Select Label <span class="req-star">*</span></label>
        `;
	});

	it('updates select label text', () => {
		updateSelectElmLabel('qux', 'New Select Label');
		const label = document.querySelector('label[for="qux-select-btn"]') as HTMLLabelElement;
		expect(label.textContent).toBe('New Select Label');
	});

	it('preserves required star in select label', () => {
		updateSelectElmLabel('quux', 'Required Select Label');
		const label = document.querySelector('label[for="quux-select-btn"]') as HTMLLabelElement;
		expect(label.innerHTML).toBe('Required Select Label <span class="req-star">*</span>');
	});
});

describe('updateToggleElmLabel', () => {
	beforeEach(() => {
		document.body.innerHTML = `
            <label for="toggle1"><span id="label-toggle1">Old Toggle Label</span></label>
            <label for="toggle2"><span id="label-toggle2">Old Toggle Label <span class="req-star">*</span></span></label>
        `;
	});

	it('updates toggle label text', () => {
		updateToggleElmLabel('toggle1', 'New Toggle Label');
		const span = document.querySelector('#label-toggle1') as HTMLSpanElement;
		expect(span.textContent).toBe('New Toggle Label');
	});

	it('preserves required star in toggle label', () => {
		updateToggleElmLabel('toggle2', 'Required Toggle Label');
		const span = document.querySelector('#label-toggle2') as HTMLSpanElement;
		expect(span.innerHTML).toBe('Required Toggle Label <span class="req-star">*</span>');
	});
});

describe('pageHeaderUpdater', () => {
	beforeEach(() => {
		document.body.innerHTML = `
            <div class="page-header">
                <span class="page-title">Old Title</span>
            </div>
        `;
	});

	it('updates page header title', () => {
		pageHeaderUpdater('New Page Title');
		const header = document.querySelector('.page-header .page-title') as HTMLElement;
		expect(header.textContent).toBe('New Page Title');
	});
});
