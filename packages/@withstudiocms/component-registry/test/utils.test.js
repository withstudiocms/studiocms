import assert from 'node:assert';
import { describe, it } from 'node:test';
import {
	convertHyphensToUnderscores,
	convertUnderscoresToHyphens,
	dedent,
	getIndent,
} from '../dist/utils.js'; // Adjust path as needed

describe('String Utilities', () => {
	describe('convertHyphensToUnderscores', () => {
		it('should convert single hyphen to underscore', () => {
			const result = convertHyphensToUnderscores('hello-world');
			assert.strictEqual(result, 'hello_world');
		});

		it('should convert multiple hyphens to underscores', () => {
			const result = convertHyphensToUnderscores('hello-world-test-case');
			assert.strictEqual(result, 'hello_world_test_case');
		});

		it('should handle consecutive hyphens', () => {
			const result = convertHyphensToUnderscores('hello--world');
			assert.strictEqual(result, 'hello__world');
		});

		it('should handle hyphens at the beginning and end', () => {
			const result = convertHyphensToUnderscores('-hello-world-');
			assert.strictEqual(result, '_hello_world_');
		});

		it('should handle empty string', () => {
			const result = convertHyphensToUnderscores('');
			assert.strictEqual(result, '');
		});

		it('should handle string with no hyphens', () => {
			const result = convertHyphensToUnderscores('helloworld');
			assert.strictEqual(result, 'helloworld');
		});

		it('should handle string with only hyphens', () => {
			const result = convertHyphensToUnderscores('---');
			assert.strictEqual(result, '___');
		});
	});

	describe('convertUnderscoresToHyphens', () => {
		it('should convert single underscore to hyphen', () => {
			const result = convertUnderscoresToHyphens('hello_world');
			assert.strictEqual(result, 'hello-world');
		});

		it('should convert multiple underscores to hyphens', () => {
			const result = convertUnderscoresToHyphens('hello_world_test_case');
			assert.strictEqual(result, 'hello-world-test-case');
		});

		it('should handle consecutive underscores', () => {
			const result = convertUnderscoresToHyphens('hello__world');
			assert.strictEqual(result, 'hello--world');
		});

		it('should handle underscores at the beginning and end', () => {
			const result = convertUnderscoresToHyphens('_hello_world_');
			assert.strictEqual(result, '-hello-world-');
		});

		it('should handle empty string', () => {
			const result = convertUnderscoresToHyphens('');
			assert.strictEqual(result, '');
		});

		it('should handle string with no underscores', () => {
			const result = convertUnderscoresToHyphens('helloworld');
			assert.strictEqual(result, 'helloworld');
		});

		it('should handle string with only underscores', () => {
			const result = convertUnderscoresToHyphens('___');
			assert.strictEqual(result, '---');
		});
	});

	describe('getIndent', () => {
		it('should return spaces for space-indented line', () => {
			const result = getIndent('    hello world');
			assert.strictEqual(result, '    ');
		});

		it('should return tabs for tab-indented line', () => {
			const result = getIndent('\t\thello world');
			assert.strictEqual(result, '\t\t');
		});

		it('should return mixed whitespace', () => {
			const result = getIndent('  \t hello world');
			assert.strictEqual(result, '  \t ');
		});

		it('should return empty string for non-indented line', () => {
			const result = getIndent('hello world');
			assert.strictEqual(result, '');
		});

		it('should return empty string for empty string', () => {
			const result = getIndent('');
			assert.strictEqual(result, '');
		});

		it('should return whitespace for line with only whitespace', () => {
			const result = getIndent('   ');
			assert.strictEqual(result, '   ');
		});

		it('should handle line with leading and trailing whitespace', () => {
			const result = getIndent('  hello world  ');
			assert.strictEqual(result, '  ');
		});
	});

	describe('dedent', () => {
		it('should remove common indentation from multi-line string', () => {
			const input = `    line 1
    line 2
    line 3`;
			const expected = `line 1
line 2
line 3`;
			const result = dedent(input);
			assert.strictEqual(result, expected);
		});

		it('should handle mixed indentation levels', () => {
			const input = `    line 1
        line 2
    line 3`;
			const expected = `line 1
    line 2
line 3`;
			const result = dedent(input);
			assert.strictEqual(result, expected);
		});

		it('should handle tab indentation', () => {
			const input = `\tline 1
\tline 2
\tline 3`;
			const expected = `line 1
line 2
line 3`;
			const result = dedent(input);
			assert.strictEqual(result, expected);
		});

		it('should handle empty first line', () => {
			const input = `
    line 1
    line 2`;
			const expected = `line 1
line 2`;
			const result = dedent(input);
			assert.strictEqual(result, expected);
		});

		it('should handle leading newlines', () => {
			const input = `\n\n    line 1
    line 2`;
			const expected = `line 1
line 2`;
			const result = dedent(input);
			assert.strictEqual(result, expected);
		});

		it('should handle single line with indentation', () => {
			const input = '    hello world';
			const expected = 'hello world';
			const result = dedent(input);
			assert.strictEqual(result, expected);
		});

		it('should handle no indentation', () => {
			const input = `line 1
line 2
line 3`;
			const expected = `line 1
line 2
line 3`;
			const result = dedent(input);
			assert.strictEqual(result, expected);
		});

		it('should handle empty string', () => {
			const result = dedent('');
			assert.strictEqual(result, '');
		});

		it('should handle only whitespace lines', () => {
			const input = `    
    line 2
    line 3`;
			const expected = `
line 2
line 3`;
			const result = dedent(input);
			assert.strictEqual(result, expected);
		});
	});

	describe('integration tests', () => {
		it('should convert hyphens to underscores and back', () => {
			const original = 'hello-world-test';
			const withUnderscores = convertHyphensToUnderscores(original);
			const backToHyphens = convertUnderscoresToHyphens(withUnderscores);
			assert.strictEqual(backToHyphens, original);
		});

		it('should convert underscores to hyphens and back', () => {
			const original = 'hello_world_test';
			const withHyphens = convertUnderscoresToHyphens(original);
			const backToUnderscores = convertHyphensToUnderscores(withHyphens);
			assert.strictEqual(backToUnderscores, original);
		});

		it('should work with dedent on indented code with hyphens', () => {
			const input = `    const hello-world = 'test';
    const foo-bar = 'value';`;
			const dedented = dedent(input);
			const converted = convertHyphensToUnderscores(dedented);
			const expected = `const hello_world = 'test';
const foo_bar = 'value';`;
			assert.strictEqual(converted, expected);
		});
	});
});
