---
"@studiocms/blog": patch
"studiocms": patch
---

Refactor rendering system to rely on plugin PageTypes instead of the old built-in system, this will allow new page types to easily bring their own renderer that can get called from the main renderer component.

#### Breaking Changes

- Removed MDX, and MarkDoc from built-in renderer. These will be replaced by plugins.
- Rendering system is now directly tied into the plugin PageTypes defined within plugins. Instead of passing just the content to the renderer, you now must pass the entire PageData from the SDK.
- New Rendering Component is now able to auto adapt to the pageType's provided renderer. (This means you can use the provided <StudioCMSRenderer /> component to render any pageType that has been configured for StudioCMS through plugins. or use the data directly and render it yourself.)

**OLD Method** (`[...slug].astro`)

```astro title="[...slug].astro"
---
import { StudioCMSRenderer } from 'studiocms:renderer';
import studioCMS_SDK from 'studiocms:sdk';
import Layout from '../layouts/Layout.astro';

let { slug } = Astro.params;

if (!slug) {
	slug = 'index';
}

const page = await studioCMS_SDK.GET.databaseEntry.pages.bySlug(slug);

if (!page) {
	return new Response(null, { status: 404 });
}

const { title, description, heroImage, defaultContent } = page;

const content = defaultContent.content || '';
---

<Layout title={title} description={description} heroImage={heroImage}>
	<main>
		<StudioCMSRenderer content={content} />
	</main>
</Layout>
```

**New Method** (`[...slug].astro`)

```astro title="[...slug].astro"
---
import { StudioCMSRenderer } from 'studiocms:renderer';
import studioCMS_SDK from 'studiocms:sdk';
import Layout from '../layouts/Layout.astro';

let { slug } = Astro.params;

if (!slug) {
	slug = 'index';
}

const page = await studioCMS_SDK.GET.databaseEntry.pages.bySlug(slug);

if (!page) {
	return new Response(null, { status: 404 });
}

const { title, description, heroImage } = page;
---

<Layout title={title} description={description} heroImage={heroImage}>
	<main>
		<StudioCMSRenderer data={page} />
	</main>
</Layout>
```