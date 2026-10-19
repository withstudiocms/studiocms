/// <reference types="astro/client" />

import * as allure from 'allure-js-commons';
import { describe, expect, vi } from 'vitest';
import Editor from '../../src/components/Editor.astro';
import { test } from '../fixtures/AstroContainer';
import { MockAstroLocalsWithCSRF, parentSuiteName, sharedTags } from '../test-utils';

// Mock the component registry
vi.mock('studiocms:component-registry/runtime', () => ({
	getRegistryComponents: vi.fn(() => [
		{
			name: 'Text',
			safeName: 'text',
			props: [
				{
					name: 'class',
					type: 'string',
					optional: true,
					description: 'CSS class for the text component',
				},
			],
		},
		{
			name: 'Heading',
			safeName: 'heading',
			props: [
				{
					name: 'class',
					type: 'string',
					optional: true,
					description: 'CSS class for the heading component',
				},
				{
					name: 'level',
					type: 'number',
					optional: true,
					defaultValue: '1',
					description: 'Heading level (1-6)',
				},
			],
		},
	]),
}));

// No need to mock Astro - we'll use Container API to pass locals directly

describe(parentSuiteName, () => {
	[
		{
			opts: {
				props: {
					content: '<p>Hello World</p>',
					id: 'test-page-id',
				},
			},
		},
		{
			opts: {
				props: {
					content: '<h1>Title</h1>',
				},
			},
		},
		{
			opts: {
				props: {
					content: '',
					id: 'empty-page',
				},
			},
		},
		{
			opts: {
				props: {
					content: `
			<div class="container">
				<h1>Title</h1>
				<p>Content with <strong>bold</strong> text</p>
				<ul>
					<li>Item 1</li>
					<li>Item 2</li>
				</ul>
			</div>
		`,
					id: 'complex-page',
				},
			},
		},
		{
			opts: {
				props: {
					content: '<p>Test</p>',
					id: 'csrf-test',
				},
				locals: MockAstroLocalsWithCSRF('mock-csrf-token'),
			},
		},
	].forEach(({ opts }, index) => {
		test(`WYSIWYG Editor Component Test Case #${index + 1}`, async ({ renderComponent }) => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite('StudioCMS WYSIWYG Plugin Tests');
			await allure.subSuite('WYSIWYG Editor Component Tests');
			await allure.tags(...sharedTags);

			const result = await renderComponent(Editor, 'Editor', opts);
			expect(result).toMatchSnapshot();
		});
	});
});
