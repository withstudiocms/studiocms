import { defineConfig } from "allure";

const packagesWithTests = [
  "studiocms",
  "effectify",

  "@studiocms/auth0",
  "@studiocms/discord",
  "@studiocms/github",
  "@studiocms/google",
  "@studiocms/devapps",
  "@studiocms/html",
  "@studiocms/cloudinary-image-service",
  "@studiocms/md",
  "@studiocms/mdx",
  "@studiocms/blog",
  "@studiocms/markdoc",
  "@studiocms/markdown-remark",
  "@studiocms/wysiwyg",

  "@withstudiocms/auth-kit",
  "@withstudiocms/buildkit",
  "@withstudiocms/cli-kit",
  "@withstudiocms/component-registry",
  "@withstudiocms/config-utils",
  "@withstudiocms/effect",
  "@withstudiocms/internal_helpers",
  "@withstudiocms/template-lang",
  "@withstudiocms/kysely",
  "@withstudiocms/sdk"
];

// Create a plugins configuration object for each package with tests, using the @allurereport/plugin-awesome plugin. The report will be named `${pkg} Tests`, and will be published to the Allure server.
const pluginsConfig = Object.fromEntries(
	packagesWithTests.map((pkg) => [
		pkg,
		{
			import: "@allurereport/plugin-awesome",
			options: {
				reportName: `${pkg} Tests`,
				singleFile: false,
				reportLanguage: "en",
				open: false,
				publish: true,
				groupBy: ["parentSuite", "suite", "subSuite"],
				filter: ({ labels }) =>
					labels.find(({ name, value }) => name === "parentSuite" && value === `${pkg} Tests`),
			},
		},
	]),
);

// Export the Allure configuration object, which includes the plugins configuration for each package with tests, as well as some general settings for the Allure report.
export default defineConfig({
	name: "Allure Report",
	output: "./allure-report",
	historyPath: "./test-history/history.jsonl",
	appendHistory: true,
	historyLimit: 20,
	qualityGate: {
		rules: [
			{
				maxFailures: 0,
				fastFail: true,
			},
		],
	},
	plugins: {
		...pluginsConfig,
		log: {
			options: {
				groupBy: "none",
			},
		},
	},
});
