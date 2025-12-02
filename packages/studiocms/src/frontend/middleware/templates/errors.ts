import { TemplateEngine } from '@withstudiocms/template-lang';

/**
 * Base HTML template for server error pages.
 */
const errorTemplateBase = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Server Error</title>
  <style>
    [data-theme=light],
    [data-theme=light] * {
        color-scheme: light;
    }
    [data-theme=dark],
    [data-theme=dark] * {
        color-scheme: dark;
    }
    :root {
        --background-base: hsl(0 0% 6%);
        --background-step-1: hsl(0 0% 8%);
        --background-step-2: hsl(0, 0%, 9%);
        --background-step-3: hsl(0, 0%, 12%);
        --background-gray: hsl(0 0% 50%);
        --text-normal: hsl(0 0% 100%);
        --text-dimmed: hsl(0 0% 100% / 0.8);
        --text-muted: hsl(0 0% 100% / 0.75);
        --text-inverted: hsl(0 0% 0%);
        --text-inverted-dimmed: hsl(0 0% 0% / 0.7);
        --text-inverted-muted: hsl(0 0% 0% / 0.65);
        --border: hsl(240 5% 17%);
        --shadow: hsl(0 0% 0% / 0.6);
        --default-base: hsl(0, 0%, 12%);
        --default-hover: hsl(0, 0%, 17%);
        --default-active: hsl(0, 0%, 14%);
        --primary-base: hsl(259, 60%, 71%);
        --primary-hover: hsl(259, 71%, 79%);
        --primary-active: hsl(259, 75%, 74%);
        --primary-vibrant: hsl(259, 75%, 74%);
        --success-base: hsl(142, 69%, 46%);
        --success-hover: hsl(142, 67%, 59%);
        --success-active: hsl(142, 84%, 55%);
        --warning-base: hsl(48, 92%, 55%);
        --warning-hover: hsl(48, 95%, 66%);
        --warning-active: hsl(48, 93%, 58%);
        --danger-base: hsl(339, 91%, 22%);
        --danger-hover: hsl(337, 90%, 27%);
        --danger-active: hsl(337, 90%, 25%);
        --danger-vibrant: hsl(339, 91%, 42%);
        --info-base: hsl(214, 96%, 22%);
        --info-hover: hsl(214, 92%, 26%);
        --info-active: hsl(214, 94%, 24%);
        --info-vibrant: hsl(214, 84%, 49%);
        --mono-base: hsl(0 0% 100%);
        --mono-hover: hsl(0 0% 90%);
        --mono-active: hsl(0 0% 95%);
        --text-light: hsl(0 0% 100%);
        --text-dark: hsl(0 0% 0%);
        --default-flat: hsl(0 0% 14% / 0.5);
        --default-flat-hover: hsl(0 0% 14% / 0.85);
        --default-flat-active: hsl(0 0% 14% / 0.75);
        --primary-flat: hsl(259 83% 73% / 0.1);
        --primary-flat-hover: hsl(259 83% 73% / 0.35);
        --primary-flat-active: hsl(259 83% 73% / 0.25);
        --success-flat: hsl(142 71% 46% / 0.1);
        --success-flat-hover: hsl(142 71% 46% / 0.35);
        --success-flat-active: hsl(142 71% 46% / 0.25);
        --warning-flat: hsl(48 96% 53% / 0.1);
        --warning-flat-hover: hsl(48 96% 53% / 0.35);
        --warning-flat-active: hsl(48 96% 53% / 0.25);
        --danger-flat: hsl(339 97% 31% / 0.1);
        --danger-flat-hover: hsl(339 97% 31% / 0.35);
        --danger-flat-active: hsl(339 97% 31% / 0.25);
        --info-flat: hsl(217 92% 52% / 0.1);
        --info-flat-hover: hsl(217 92% 52% / 0.35);
        --info-flat-active: hsl(217 92% 52% / 0.25);
        --mono-flat: hsl(0 0% 70% / 0.1);
        --mono-flat-hover: hsl(0 0% 70% / 0.35);
        --mono-flat-active: hsl(0 0% 70% / 0.25);
    }
    [data-theme=light] {
        --background-base: hsl(0 0% 97%);
        --background-step-1: hsl(0 0% 95%);
        --background-step-2: hsl(0 0% 92%);
        --background-step-3: hsl(0 0% 89%);
        --background-gray: hsl(0 0% 50%);
        --text-normal: hsl(0 0% 0%);
        --text-dimmed: hsl(0 0% 0% / 0.8);
        --text-muted: hsl(0 0% 0% / 0.75);
        --text-inverted: hsl(0 0% 100%);
        --text-inverted-dimmed: hsl(0 0% 100% / 0.85);
        --text-inverted-muted: hsl(0 0% 100% / 0.75);
        --border: hsl(263 5% 68%);
        --shadow: hsl(0 0% 65% / 0.6);
        --default-base: hsl(0, 0%, 82%);
        --default-hover: hsl(0, 0%, 91%);
        --default-active: hsl(0, 0%, 86%);
        --primary-base: hsl(259, 74%, 25%);
        --primary-hover: hsl(259, 76%, 35%);
        --primary-active: hsl(259, 76%, 32%);
        --primary-vibrant: hsl(259, 75%, 45%);
        --success-base: hsl(142, 60%, 44%);
        --success-hover: hsl(142, 60%, 55%);
        --success-active: hsl(142 60% 50%);
        --warning-base: hsl(48, 84%, 42%);
        --warning-hover: hsl(48, 85%, 49%);
        --warning-active: hsl(48, 86%, 45%);
        --danger-base: hsl(339, 93%, 15%);
        --danger-hover: hsl(337, 88%, 22%);
        --danger-active: hsl(337, 89%, 19%);
        --danger-vibrant: hsl(339, 86%, 38%);
        --info-base: hsl(214, 96%, 22%);
        --info-hover: hsl(214, 92%, 26%);
        --info-active: hsl(214, 94%, 24%);
        --info-vibrant: hsl(214, 88%, 39%);
        --mono-base: hsl(0 0% 10%);
        --mono-hover: hsl(0 0% 16%);
        --mono-active: hsl(0 0% 14%);
        --default-flat: hsl(0 0% 70% / 0.5);
        --default-flat-hover: hsl(0 0% 70% / 0.85);
        --default-flat-active: hsl(0 0% 70% / 0.75);
    }

    body {
        font-family: system-ui, -apple-system, sans-serif;
        max-width: 800px;
        margin: 50px auto;
        padding: 20px;
        background: var(--background-base);
        color: var(--text-normal);
    }
    .error-container {
        background: var(--background-step-3);
        border-left: 4px solid var(--danger-vibrant);
        padding: 30px;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    h1 {
        color: var(--danger-vibrant);
        margin-top: 0;
    }
    .error-message {
        background: color-mix(in hsl, var(--background-step-3), var(--danger-base) 10%);
        border: 1px solid var(--danger-base);
        padding: 15px;
        border-radius: 4px;
        margin: 20px 0;
        font-family: monospace;
        color: var(--danger-vibrant);
    }
    .stack-trace {
        background: #1a202c;
        color: #e2e8f0;
        padding: 15px;
        border-radius: 4px;
        overflow-x: auto;
        font-family: monospace;
        font-size: 14px;
        line-height: 1.5;
        white-space: pre;
    }
    .hint {
        color: var(--text-muted);
        font-size: 14px;
        margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="error-container">
    <h1>⚠️ Server Error</h1>
    <p>An error occurred while processing your request.</p>
    
    <div class="error-message">
      {{error.message}}
    </div>`;

/**
 * Development mode error template with stack trace.
 */
const errorTemplateDev = `
    ${errorTemplateBase}

    <details>
      <summary style="cursor: pointer; margin: 20px 0;">View stack trace</summary>
      <div class="stack-trace">{{error.stack}}</div>
    </details>
    
    <div class="hint">
      This detailed error is only shown in development mode.
    </div>
  </div>
</body>
</html>`;

/**
 * Production mode error template with expandable stack trace.
 */
const errorTemplateProd = `
    ${errorTemplateBase}
    
    <div class="hint">
      Please try again later or contact support if the problem persists.
    </div>
  </div>
</body>
</html>`;

// Initialize the template engine
const engine = new TemplateEngine();

// Compile the templates
const devTemplate = engine.compile(errorTemplateDev);
const prodTemplate = engine.compile(errorTemplateProd);

/**
 * Interface representing the data structure for the error template.
 */
export interface ErrorTemplateData {
	message: string;
	stack: string;
}

/**
 * Renders an error template based on the provided error data and environment.
 *
 * @param error - The error data containing message and stack trace.
 * @param isDev - A boolean indicating if the environment is development.
 * @returns The rendered HTML string of the error template.
 */
export function renderErrorTemplate(error: ErrorTemplateData, isDev: boolean): string {
	const template = isDev ? devTemplate : prodTemplate;
	return template({ error });
}
