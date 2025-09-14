import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanupGlobalThis, mockGlobalThis } from './test-utils.js';

// Mock the dependencies
vi.mock('suneditor/dist/css/suneditor.min.css', () => ({}));
vi.mock('codemirror/lib/codemirror.css', () => ({}));
vi.mock('katex/dist/katex.min.css', () => ({}));

vi.mock('studiocms:component-registry/runtime', () => ({
	createRenderer: vi.fn(() => Promise.resolve((content: string) => content)),
}));

vi.mock('studiocms/types', () => ({
	PluginPageTypeEditorProps: {},
	PluginPageTypeRendererProps: {},
}));

describe('Astro Components', () => {
	beforeEach(() => {
		cleanupGlobalThis();
		mockGlobalThis();
	});

	describe('editor.astro', () => {
		it('should have correct component structure', () => {
			// Test that the component file exists and has expected structure
			const fs = require('fs');
			const path = require('path');
			const editorPath = path.join(__dirname, '../src/components/editor.astro');
			
			expect(fs.existsSync(editorPath)).toBe(true);
			
			const content = fs.readFileSync(editorPath, 'utf8');
			expect(content).toContain('editor-container');
			expect(content).toContain('page-content');
			expect(content).toContain('textarea');
		});

		it('should import necessary CSS files', () => {
			const fs = require('fs');
			const path = require('path');
			const editorPath = path.join(__dirname, '../src/components/editor.astro');
			const content = fs.readFileSync(editorPath, 'utf8');
			
			expect(content).toContain('suneditor/dist/css/suneditor.min.css');
			expect(content).toContain('codemirror/lib/codemirror.css');
			expect(content).toContain('katex/dist/katex.min.css');
		});

		it('should have SunEditor configuration', () => {
			const fs = require('fs');
			const path = require('path');
			const editorPath = path.join(__dirname, '../src/components/editor.astro');
			const content = fs.readFileSync(editorPath, 'utf8');
			
			expect(content).toContain('sunEditor.create');
			expect(content).toContain('buttonList');
			expect(content).toContain('onChange');
		});
	});

	describe('renderer.astro', () => {
		it('should have correct component structure', () => {
			const fs = require('fs');
			const path = require('path');
			const rendererPath = path.join(__dirname, '../src/components/renderer.astro');
			
			expect(fs.existsSync(rendererPath)).toBe(true);
			
			const content = fs.readFileSync(rendererPath, 'utf8');
			expect(content).toContain('createRenderer');
			expect(content).toContain('defaultContent');
			expect(content).toContain('set:html');
		});

		it('should handle error cases', () => {
			const fs = require('fs');
			const path = require('path');
			const rendererPath = path.join(__dirname, '../src/components/renderer.astro');
			const content = fs.readFileSync(rendererPath, 'utf8');
			
			expect(content).toContain('Error: No content found');
			expect(content).toContain('defaultContent?.content');
		});

		it('should use shared htmlConfig for sanitization', () => {
			const fs = require('fs');
			const path = require('path');
			const rendererPath = path.join(__dirname, '../src/components/renderer.astro');
			const content = fs.readFileSync(rendererPath, 'utf8');
			
			expect(content).toContain('shared.htmlConfig?.sanitize');
		});
	});
});
