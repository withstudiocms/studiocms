import stripAnsi from 'strip-ansi';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import run from '../index.js';

describe('buildkit CLI', () => {
  let consoleLogSpy;
  let originalArgv;
  
  beforeEach(() => {
    originalArgv = process.argv;
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    process.argv = originalArgv;
    consoleLogSpy.mockRestore();
  });

  describe('help command', () => {
    it('should show help when no command is provided', async () => {
      // Set up process.argv for no command
      process.argv = ['node', 'buildkit'];
      
      // Run the CLI
      await run();
      
      expect(consoleLogSpy).toHaveBeenCalled();
      
      // Get all console.log calls combined
      const output = consoleLogSpy.mock.calls
        .map(call => stripAnsi(call[0]))
        .join('\n');
      
      // Verify help content
      expect(output).toContain('StudioCMS Buildkit');
      expect(output).toContain('Usage:');
      expect(output).toContain('Commands:');
      expect(output).toContain('dev');
      expect(output).toContain('build');
      expect(output).toContain('Options:');
      expect(output).toContain('--no-clean-dist');
      expect(output).toContain('--bundle');
      expect(output).toContain('--force-cjs');
    });

    it('should show help with invalid command', async () => {
      // Set up process.argv with invalid command
      process.argv = ['node', 'buildkit', 'invalid-command'];
      
      // Run the CLI
      await run();
      
      expect(consoleLogSpy).toHaveBeenCalled();
      
      // Get all console.log calls combined
      const output = consoleLogSpy.mock.calls
        .map(call => stripAnsi(call[0]))
        .join('\n');
      
      // Verify help content
      expect(output).toContain('StudioCMS Buildkit');
      expect(output).toContain('Usage:');
    });
  });
}); 