import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { createURLGenFactory } from '../dist/urlGenFactory.js';

describe('urlGenFactory', () => {
	test('createURLGenFactory returns a function', () => {
		const urlGen = createURLGenFactory('dashboard');
		assert.equal(typeof urlGen, 'function');
	});

	test('dashboard route with path', () => {
		const urlGen = createURLGenFactory('dashboard');
		assert.equal(urlGen(true, 'settings'), '/dashboard/settings');
		assert.equal(urlGen(true, '/settings/'), '/dashboard/settings');
		assert.equal(urlGen(true, 'settings/profile'), '/dashboard/settings/profile');
	});

	test('dashboard route without path', () => {
		const urlGen = createURLGenFactory('dashboard');
		assert.equal(urlGen(true, undefined), '/dashboard');
		assert.equal(urlGen(true, ''), '/dashboard');
	});

	test('non-dashboard route with path', () => {
		const urlGen = createURLGenFactory('dashboard');
		assert.equal(urlGen(false, 'about'), '/about');
		assert.equal(urlGen(false, '/about/'), '/about');
		assert.equal(urlGen(false, 'about/team'), '/about/team');
	});

	test('non-dashboard route without path', () => {
		const urlGen = createURLGenFactory('dashboard');
		assert.equal(urlGen(false, undefined), '/');
		assert.equal(urlGen(false, ''), '/');
	});

	test('dashboard route with override', () => {
		const urlGen = createURLGenFactory('dashboard');
		assert.equal(urlGen(true, 'settings', 'admin'), '/admin/settings');
		assert.equal(urlGen(true, '/settings/', '/admin/'), '/admin/settings');
		assert.equal(urlGen(true, undefined, 'admin'), '/admin');
	});

	test('non-dashboard route with override', () => {
		const urlGen = createURLGenFactory('dashboard');
		assert.equal(urlGen(false, 'about', 'admin'), '/about');
		assert.equal(urlGen(false, undefined, 'admin'), '/');
	});
});
