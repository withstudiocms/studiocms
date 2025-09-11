import { describe, expect, it } from 'vitest';
import { createURLGenFactory } from '../src/urlGenFactory.js';

describe('urlGenFactory', () => {
	it('createURLGenFactory returns a function', () => {
		const urlGen = createURLGenFactory('dashboard');
		expect(typeof urlGen).toBe('function');
	});

	it('dashboard route with path', () => {
		const urlGen = createURLGenFactory('dashboard');
		expect(urlGen(true, 'settings')).toBe('/dashboard/settings');
		expect(urlGen(true, '/settings/')).toBe('/dashboard/settings');
		expect(urlGen(true, 'settings/profile')).toBe('/dashboard/settings/profile');
	});

	it('dashboard route without path', () => {
		const urlGen = createURLGenFactory('dashboard');
		expect(urlGen(true, undefined)).toBe('/dashboard');
		expect(urlGen(true, '')).toBe('/dashboard');
	});

	it('non-dashboard route with path', () => {
		const urlGen = createURLGenFactory('dashboard');
		expect(urlGen(false, 'about')).toBe('/about');
		expect(urlGen(false, '/about/')).toBe('/about');
		expect(urlGen(false, 'about/team')).toBe('/about/team');
	});

	it('non-dashboard route without path', () => {
		const urlGen = createURLGenFactory('dashboard');
		expect(urlGen(false, undefined)).toBe('/');
		expect(urlGen(false, '')).toBe('/');
	});

	it('dashboard route with override', () => {
		const urlGen = createURLGenFactory('dashboard');
		expect(urlGen(true, 'settings', 'admin')).toBe('/admin/settings');
		expect(urlGen(true, '/settings/', '/admin/')).toBe('/admin/settings');
		expect(urlGen(true, undefined, 'admin')).toBe('/admin');
	});

	it('non-dashboard route with override', () => {
		const urlGen = createURLGenFactory('dashboard');
		expect(urlGen(false, 'about', 'admin')).toBe('/about');
		expect(urlGen(false, undefined, 'admin')).toBe('/');
	});
});
