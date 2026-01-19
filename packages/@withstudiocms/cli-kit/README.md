# @withstudiocms/cli-kit

[![codecov](https://codecov.io/github/withstudiocms/studiocms/graph/badge.svg?token=RN8LT1O5E2&component=withstudiocms_cli_kit)](https://codecov.io/github/withstudiocms/studiocms)

A comprehensive toolkit for building command-line interfaces with StudioCMS. This package provides utilities for shell command execution, terminal styling, message formatting, and CLI context management.

## Installation

```bash
pnpm add @withstudiocms/cli-kit
# or
npm install @withstudiocms/cli-kit
# or
yarn add @withstudiocms/cli-kit
```

## Features

- 🚀 **Shell Command Execution** - Execute shell commands with proper error handling and timeout support
- 🎨 **Terminal Styling** - Style terminal output with custom hex colors and ANSI escape codes
- 📦 **CLI Utilities** - Message formatting, user input handling, and interactive prompts
- 🔧 **Context Management** - Package manager detection and CLI environment utilities
- ✅ **TypeScript First** - Full TypeScript support with comprehensive type definitions

## Modules

### Utils (`@withstudiocms/cli-kit/utils`)

Utilities for executing shell commands and handling file paths.

#### Key Functions

##### `shell(command, flags, opts)`

Execute shell commands with proper error handling.

```typescript
import { shell } from '@withstudiocms/cli-kit/utils';

const result = await shell('npm', ['install'], { 
  cwd: '/path/to/project',
  timeout: 30000 
});
console.log(result.stdout);
```

##### `exec(command, args, options)`

Enhanced command execution with improved error logging using tinyexec.

```typescript
import { exec } from '@withstudiocms/cli-kit/utils';

const result = await exec('git', ['status'], { throwOnError: true });
```

##### `commandExists(command)`

Check if a command is available on the system.

```typescript
import { commandExists } from '@withstudiocms/cli-kit/utils';

if (commandExists('git')) {
  console.log('Git is installed');
}
```

##### `runInteractiveCommand(command, options)`

Run commands interactively with stdio inheritance.

```typescript
import { runInteractiveCommand } from '@withstudiocms/cli-kit/utils';

await runInteractiveCommand('npm install', { 
  shell: true, 
  stdio: 'inherit' 
});
```

##### `resolveRoot(cwd)`

Resolve the root directory path.

```typescript
import { resolveRoot } from '@withstudiocms/cli-kit/utils';

const root = resolveRoot('/home/user/project');
const defaultRoot = resolveRoot(); // uses process.cwd()
```

##### `exists(path)`

Check if a file or directory exists.

```typescript
import { exists } from '@withstudiocms/cli-kit/utils';

if (exists('/path/to/file.txt')) {
  console.log('File exists');
}
```

##### `pathToFileURL(path)`

Convert file system paths to file URLs.

```typescript
import { pathToFileURL } from '@withstudiocms/cli-kit/utils';

const url = pathToFileURL('/home/user/file.txt');
// Returns: URL { href: 'file:///home/user/file.txt' }
```

### Colors (`@withstudiocms/cli-kit/colors`)

Terminal text styling with custom hex colors.

#### Key Functions

##### `styleTextHex(hexColor)`

Create a function to style text with a custom hex color.

```typescript
import { styleTextHex } from '@withstudiocms/cli-kit/colors';

const redText = styleTextHex('#FF0000');
console.log(redText('This is red text'));
```

##### `styleTextBgHex(hexColor)`

Style text with a custom background color.

```typescript
import { styleTextBgHex } from '@withstudiocms/cli-kit/colors';

const blueBg = styleTextBgHex('#0000FF');
console.log(blueBg('Text with blue background'));
```

#### Predefined Colors

```typescript
import {
  StudioCMSColorway,
  StudioCMSColorwayBg,
  StudioCMSColorwayInfo,
  StudioCMSColorwayWarn,
  StudioCMSColorwayError,
  supportsColor
} from '@withstudiocms/cli-kit/colors';

if (supportsColor) {
  console.log(StudioCMSColorway('Primary text'));
  console.log(StudioCMSColorwayInfo('Success message'));
  console.log(StudioCMSColorwayWarn('Warning message'));
  console.log(StudioCMSColorwayError('Error message'));
}
```

### Messages (`@withstudiocms/cli-kit/messages`)

Formatted messages and CLI UI elements.

#### Key Functions

##### `success(message, tip?)`

Display success messages with optional tips.

```typescript
import { success } from '@withstudiocms/cli-kit/messages';

console.log(success('Build completed', 'Run `npm start` to preview'));
```

##### `cancelled(message, tip?)`

Display cancellation messages.

```typescript
import { cancelled } from '@withstudiocms/cli-kit/messages';

console.log(cancelled('Operation was cancelled'));
```

##### `label(text, color?, style?)`

Create labeled text with custom styling.

```typescript
import { label, StudioCMSColorwayBg } from '@withstudiocms/cli-kit/messages';

console.log(label('INFO', StudioCMSColorwayBg, ['whiteBright']));
```

##### `getName()`

Get the current user's name from system.

```typescript
import { getName } from '@withstudiocms/cli-kit/messages';

const userName = await getName();
console.log(`Hello, ${userName}!`);
```

### Context (`@withstudiocms/cli-kit/context`)

CLI context and environment utilities.

#### Key Functions

##### `detectPackageManager()`

Detect the package manager being used.

```typescript
import { detectPackageManager } from '@withstudiocms/cli-kit/context';

const pm = detectPackageManager();
console.log(`Using ${pm}`); // Output: 'pnpm', 'npm', 'yarn', etc.
```

## Type Definitions

### `ExecaOptions`

```typescript
interface ExecaOptions {
  cwd?: string | URL;
  stdio?: StdioOptions;
  timeout?: number;
}
```

### `Output`

```typescript
interface Output {
  stdout: string;
  stderr: string;
  exitCode: number;
}
```

## Error Handling

The package provides comprehensive error handling:

```typescript
import { shell } from '@withstudiocms/cli-kit/utils';

try {
  await shell('some-command', ['--flag'], { timeout: 5000 });
} catch (error) {
  if (error.message === 'Timeout') {
    console.error('Command timed out');
  } else {
    console.error('Command failed:', error);
  }
}
```

## Dependencies

- **strip-ansi** - Remove ANSI escape codes
- **wrap-ansi** - Wrap text with ANSI support
- **boxen** - Create boxes in the terminal
- **ansi-escapes** - ANSI escape code utilities
- **cli-cursor** - Show/hide terminal cursor
- **is-unicode-supported** - Detect Unicode support
- **slice-ansi** - Slice strings with ANSI codes
- **tinyexec** - Minimal process execution

## License

MIT

## Contributing

Contributions are welcome! Please check our [contributing guidelines](https://github.com/withstudiocms/studiocms/blob/main/CONTRIBUTING.md).

## Links

- [StudioCMS Documentation](https://studiocms.dev)
- [GitHub Repository](https://github.com/withstudiocms/studiocms)
- [Discord Community](https://chat.studiocms.dev)
- [Issue Tracker](https://github.com/withstudiocms/studiocms/issues)
