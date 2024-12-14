export const CoreStrings = {
	Start: 'Setting up StudioCMS Core...',
	AddVirtualImports: 'Adding Virtual Imports...',
	AddVirtualDTS: 'Creating and Adding Virtual DTS File...',
	SetupComplete: 'StudioCMS Core Setup Complete.',
	AstroConfigCheck: 'Astro Config `output` & `site` options valid',
};

export const DbErrors = {
	AstroConfigOutput: "StudioCMS is only supported in 'Output: server' SSR mode.",
	AstroConfigSiteURL:
		"StudioCMS requires a 'site' configuration in your Astro Config. This can be your domain ( 'https://example.com' ) or localhost ( 'http://localhost:4321' - localhost should only be used during development and should not be used in production).",
	DbStartPage:
		'Start Page is Enabled.  This will be the only page available until you initialize your database and disable the config option forcing this page to be displayed. To get started, visit http://localhost:4321/start/ in your browser to initialize your database. And Setup your installation.',
	astroDbMissingMessage: 'Astro DB Integration not found in Astro Config',
	astroDbMissingHint:
		'Run `astro add db` to install `@astrojs/db` and add it to your Astro config.',
};

export const studioErrors = {
	failedToParseConfig:
		"The StudioCMS config file ('studiocms.config.mjs') was found but the following errors where encountered while parsing it:",
	invalidConfigFile: 'Invalid StudioCMS Config File',
	invalidOrMissingExport:
		'Missing or invalid default export. Please export your StudioCMS config object as the default export.',
	loadingError: `Your project includes an StudioCMS config file ("studiocms.config.mjs") that could not be loaded due to`,
};

export const warnings = {
	StudioCMSConfigPresent:
		'Your project includes a StudioCMS config file ("studiocms.config.{mjs|js|ts|mts|cjs|cts}"). To avoid unexpected results from merging multiple config sources, move all StudioCMS options to the StudioCMS config file. Or remove the file to use only the options provided in the Astro config.',
	MultipleRendererPlugins:
		'Multiple Renderer Plugins are Enabled.  Only one Renderer Plugin can be enabled at a time.  The first Renderer Plugin in the list will be used.',
};

export const DashboardStrings = {
	Setup: 'Setting up StudioCMS Dashboard...',
	AddIntegrations: 'Adding Dashboard Integrations...',
	TestAndDemo:
		'Testing and Demo Mode is Enabled, Authentication will not be required to access dashboard pages.  But you will only be able to edit the database directly',
	AuthEnabled: 'Auth is Enabled, Setting Up...',
	AuthDisabled:
		'Auth is Disabled by the User Configuration.  You will only be able to edit the database directly',
	AuthRoutes: 'Setting up Auth Routes...',
	DashboardEnabled: 'Dashboard is Enabled.',
	DashboardDisabled:
		'Dashboard is Disabled, Some tools and Utilities are still available for developers who are customizing their setup!',
	Middleware: 'Adding Dashboard Middleware...',
	SetupComplete: 'StudioCMS Dashboard is Setup and Ready to Go!',
};

export const imageHandlerStrings = {
	CloudinaryCDNWarning:
		'Using the Cloudinary CDN JS SDK Plugin requires the CMS_CLOUDINARY_CLOUDNAME environment variable to be set. Please add this to your .env file.',
	CustomImageLog: 'Configuring CustomImage Component...',
	updateConfig:
		'Updating Astro Config with Image Service Configuration to allow for remote images...',
};

export const AuthProviderLogStrings = {
	githubLogs: {
		enabledMessage: 'GitHub Auth Provider is Enabled',
		disabledMessage: 'GitHub Auth Provider is Disabled',
	},
	discordLogs: {
		enabledMessage: 'Discord Auth Provider is Enabled',
		disabledMessage: 'Discord Auth Provider is Disabled',
	},
	googleLogs: {
		enabledMessage: 'Google Auth Provider is Enabled',
		disabledMessage: 'Google Auth Provider is Disabled',
	},
	auth0Logs: {
		enabledMessage: 'Auth0 Auth Provider is Enabled',
		disabledMessage: 'Auth0 Auth Provider is Disabled',
	},
	usernameAndPasswordLogs: {
		enabledMessage: 'Username and Password Auth Provider is Enabled',
		disabledMessage: 'Username and Password Auth Provider is Disabled',
	},
	allowUserRegistration: {
		enabledMessage: 'User Registration is Enabled',
		disabledMessage: 'User Registration is Disabled',
	},
};

export const CheckENVStrings = {
	CheckStart: 'Checking Environment Variables...',
	CheckComplete: 'Environment Variables Check Complete.',
	GithubMessages: {
		CheckMessage: 'Github Auth Enabled, Checking Github Environment Variables...',
		ErrorMessage:
			'The Following Github Keys are Missing and are Required for the Github Authentication to work:',
	},
	DiscordMessages: {
		CheckMessage: 'Discord Auth Enabled, Checking Discord Environment Variables...',
		ErrorMessage:
			'The Following Discord Keys are Missing and are Required for the Discord Authentication to work:',
	},
	GoogleMessages: {
		CheckMessage: 'Google Auth Enabled, Checking Google Environment Variables...',
		ErrorMessage:
			'The Following Google Keys are Missing and are Required for the Google Authentication to work:',
	},
	Auth0Messages: {
		CheckMessage: 'Auth0 Auth Enabled, Checking Auth0 Environment Variables...',
		ErrorMessage:
			'The Following Auth0 Keys are Missing and are Required for the Auth0 Authentication to work:',
	},
	EncryptionMessages: {
		CheckMessage: 'Checking Encryption Key...',
		ErrorMessage: 'The CMS_ENCRYPTION_KEY is Missing and is Required for StudioCMS to work:',
	},
};

export const authConfigStrings = {
	configSetup: 'Setting up StudioCMS Username and Password Authentication...',
	readConfig: 'Trying to read studiocms-auth.config.json...',
	saltMissing: "studiocms-auth.config.json is missing the required 'salt' field",
	eRC: {
		part1: 'Error reading studiocms-auth.config.json: ',
		part2: ', Generating new salt...',
	},
	newSalt: 'Writing new studiocms-auth.config.json with new salt...',
	writeFileError: 'Error writing new studiocms-auth.config.json: ',
	newConfig: 'New studiocms-auth.config.json generated with salt: ',
	configComplete: 'StudioCMS Username and Password Authentication Setup Complete!',
};

export const webVitalStrings = {
	checkForWebVitals: "Checking for '@astrojs/web-vitals' integration...",
	webVitalsFound: 'Web Vitals Integration Found!',
	webVitalsMissing:
		"'@astrojs/web-vitals' Integration Missing! The '@astrojs/web-vitals' integration is required if you want the Web Vitals features to be displayed in the StudioCMS Dashboard.",
};
