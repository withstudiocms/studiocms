/// <reference types="astro/client" />
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, test } from 'vitest';
import PageHeader from '../../../src/components/first-time-setup/PageHeader.astro';
import { cleanAstroAttributes, MockAstroLocals } from '../../test-utils';

describe('PageHeader component', () => {
	test('render component', async () => {
		const container = await AstroContainer.create();
		const result = await container.renderToString(PageHeader, {
			locals: MockAstroLocals(),
			props: { title: 'Test Page' },
		});
		const cleanResult = cleanAstroAttributes(result, '/mock/path/PageHeader.astro');
		expect(cleanResult).toMatchSnapshot();
	});
	test('render component with badge', async () => {
		const container = await AstroContainer.create();
		const result = await container.renderToString(PageHeader, {
			locals: MockAstroLocals(),
			props: { title: 'Test Page', badge: { label: 'New' } },
		});
		const cleanResult = cleanAstroAttributes(result, '/mock/path/PageHeader.astro');
		expect(cleanResult).toMatchSnapshot();
	});
	test('render component with badge and icon', async () => {
		const container = await AstroContainer.create();
		const result = await container.renderToString(PageHeader, {
			locals: MockAstroLocals(),
			props: { title: 'Test Page', badge: { label: 'New', icon: 'heroicons:academic-cap' } },
		});
		const cleanResult = cleanAstroAttributes(result, '/mock/path/PageHeader.astro');
		expect(cleanResult).toMatchSnapshot();
	});
});
