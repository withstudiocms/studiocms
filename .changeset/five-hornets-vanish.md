---
"studiocms": patch
---

User invite and creation systems

### User Management Enhancements:
* Added modals for creating new users and user invites in `InnerSidebarElement.astro` to streamline the user creation process.
* Implemented new API routes `create-user` and `create-user-invite` to handle user creation and invite processes.
* Updated `routeMap.ts` to include new endpoints for user creation and invites.

### UI Improvements:
* Modified icons for 'Create Page' and 'Create Folder' options in `InnerSidebarElement.astro` to use standard document and folder icons.
* Enhanced the user management dropdown by reordering properties for better readability.
* Added custom styles for modal bodies to improve the user interface.

### Utility and SDK Updates:
* Added new utility functions for generating random passwords and IDs in `generators.ts`, and updated references in `core.ts`.
* Updated the SDK core to support rank assignment during user creation.