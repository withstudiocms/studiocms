/// <reference types="astro/client" />
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { beforeAll, describe, expect, test } from 'vitest';
import AuthLayout from '../src/layouts/AuthLayout.astro';
import FirstTimeSetupLayout from '../src/layouts/FirstTimeSetupLayout.astro';
import { cleanAstroAttributes, MockAstroLocals } from './test-utils';

describe('Layout Container tests', () => {
	let container: AstroContainer;

	beforeAll(async () => {
		container = await AstroContainer.create();
	});

	describe('FirstTimeSetupLayout Container', () => {
		test('render component', async () => {
			const result = await container.renderToString(FirstTimeSetupLayout, {
				locals: MockAstroLocals(),
				props: { title: 'Test Title', description: 'Test Description' },
			});
			const cleanResult = cleanAstroAttributes(result, '/mock/path/FirstTimeSetupLayout.astro');
			expect(cleanResult).toMatchSnapshot();
		});
	});

	describe('AuthLayout Container', () => {
		test('render component', async () => {
			const result = await container.renderToString(AuthLayout, {
				locals: MockAstroLocals(),
				props: { title: 'Test Title', description: 'Test Description', lang: 'en' },
			});
			const cleanResult = cleanAstroAttributes(result, '/mock/path/AuthLayout.astro');
			expect(cleanResult).toMatchSnapshot();
		});
	});
});
