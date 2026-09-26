# StudioCMS - Headless Template

```bash
npm create studiocms@latest -- --template studiocms/headless
```

Welcome to your new StudioCMS project! Here's a quick checklist to get you started:

- [x] Run the install command with your favorite package manager
- [ ] Make sure your [`.env` variables](https://docs.studiocms.dev/start-here/environment-variables/) are set
- [ ] Push your DB schema by running `npm run migrate`
- [ ] Start dev server (`npm run dev`) and go through the first time setup
- [ ] Open `src/pages/index.astro` for a basic example of how to fetch data from StudioCMS and [read the docs](https://docs.studiocms.dev) to find out more!

Once you're done, you can tweak your configuration for StudioCMS in the `studiocms.config.mjs` file.

## 📂 Project Structure

Inside your new project, you'll find the following folders and files. Here's what you need to know:

- Since StudioCMS is an Astro Integration, this is a normal Astro project.
- All configuration for StudioCMS is done in the `studiocms.config.mjs` file.
- The `index.astro` page provides a minimal example of how to use our SDK to fetch data.

```
public/
└── favicon.svg
src/
├── layouts/
│   └── Layout.astro
└── pages/
    └── index.astro
.env.demo
README.md
astro.config.mjs
package.json
studiocms.config.mjs
tsconfig.json
```
