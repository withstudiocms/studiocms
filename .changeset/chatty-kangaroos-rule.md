---
"@studiocms/dashboard": patch
"@studiocms/auth": patch
"@studiocms/core": patch
"@studiocms/ui": patch
"studiocms": patch
---

Auth system overhaul:

## **`studiocms`**

- Updated all Dependencies

## **`@studiocms/auth`**

- Update `astro:env` schema:
    - `CMS_ENCRYPTION_KEY`: NEW - Required variable used for auth encryption, can be generated using `openssl rand --base64 16`.
    - `CMS_GITHUB_REDIRECT_URI`: NEW - Optional variable for GitHub Redirect URI if using multiple redirect URIs with Github oAuth.
- Removed `Luicia` based auth system and `Lucia-astrodb-adapter`
- Removed old `authHelper`
- Add new OAuthButton components
    - `<OAuthButton />`
    - `<OAuthButtonStack />`
    - `oAuthButtonProviders.ts`
- Add new `<AuthLayout />` component and CSS
- Add new authentication library:
    - Auth library is built using the lucia-next resources and will now be maintained under `@studiocms/auth` as its own full module
    - Created Virtual module exports available during runtime
- Add new login/signup backgrounds
- Remove Middleware
- Add `studiocms-logo.glb` for usage with New ThreeJS login/signup page
- Update all Auth Routes
- Update schema
- Add new Scripts for ThreeJS
- Update Stubs files and Utils
- Refactor Integration to use new system.

## **`@studiocms/core`**

- Disable interactivity for `<Avatar />` component. (Will always show a empty profile icon until we setup the new system for the front-end)
- Update table schema:
    - `StudioCMSUsers`: Removed oAuth ID's from main user table

    ```diff
    export const StudioCMSUsers = defineTable({
        columns: {
            id: column.text({ primaryKey: true }),
            url: column.text({ optional: true }),
            name: column.text(),
            email: column.text({ unique: true, optional: true }),
            avatar: column.text({ optional: true }),
    -	    githubId: column.number({ unique: true, optional: true }),
    -	    githubURL: column.text({ optional: true }),
    -	    discordId: column.text({ unique: true, optional: true }),
    -	    googleId: column.text({ unique: true, optional: true }),
    -	    auth0Id: column.text({ unique: true, optional: true }),
            username: column.text(),
            password: column.text({ optional: true }),
            updatedAt: column.date({ default: NOW, optional: true }),
            createdAt: column.date({ default: NOW, optional: true }),
        },
    });
    ```

    - `StudioCMSOAuthAccounts`: New table to handle all oAuth accounts and linking to Users

    ```ts
    export const StudioCMSOAuthAccounts = defineTable({
        columns: {
            provider: column.text(), // github, google, discord, auth0
            providerUserId: column.text({ primaryKey: true }),
            userId: column.text({ references: () => StudioCMSUsers.columns.id }),
        },
    });
    ```

    - `StudioCMSPermissions`: Updated to use direct reference to users table

    ```ts
    export const StudioCMSPermissions = defineTable({
        columns: {
            user: column.text({ references: () => StudioCMSUsers.columns.id }),
            rank: column.text(),
        },
    });
    ```

    - `StudioCMSSiteConfig`: Added new options for login page

    ```ts
    export const StudioCMSSiteConfig = defineTable({
        columns: {
            id: column.number({ primaryKey: true }),
            title: column.text(),
            description: column.text(),
            defaultOgImage: column.text({ optional: true }),
            siteIcon: column.text({ optional: true }),
            loginPageBackground: column.text({ default: 'studiocms-curves' }),
            loginPageCustomImage: column.text({ optional: true }),
        },
    });
    ```

- Updated Routemap:
    - All Auth api routes are now located at `yourhost.tld/studiocms_api/auth/*`

- Updated Strings:
    - Add new Encryption messages for the new `CMS_ENCRYPTION_KEY` variable

- Removed now unused auth types.

## **`@studiocms/dashboard`**

- Refactor to utilize new `@studiocms/auth` lib for user verification

## **`@studiocms/ui`**

- Update `<Input />` component's available types