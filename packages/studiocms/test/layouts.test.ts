/// <reference types="astro/client" />
import { describe, expect } from 'vitest';
import AuthLayout from '../src/layouts/AuthLayout.astro';
import FirstTimeSetupLayout from '../src/layouts/FirstTimeSetupLayout.astro';
import { test } from './fixtures/AstroContainer';

describe('Layout Container tests', () => {
	describe('FirstTimeSetupLayout Container', () => {
		test('render component', async ({ renderComponent }) => {
			const result = await renderComponent(FirstTimeSetupLayout, 'FirstTimeSetupLayout', {
				props: { title: 'Test Title', description: 'Test Description' },
			});
			expect(result).toMatchSnapshot();
		});
	});

	describe('AuthLayout Container', () => {
		test('render component', async ({ renderComponent }) => {
			const result = await renderComponent(AuthLayout, 'AuthLayout', {
				props: { title: 'Test Title', description: 'Test Description', lang: 'en' },
			});
			expect(result).toMatchSnapshot();
		});
	});
});
