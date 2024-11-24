export { default as SponsorLink } from './util/SponsorLink.astro';

// This file is used to define the sponsors and their respective urls.
export const sponsors = {
	turso: {
		docs: {
			sidebarSponsorLink: 'https://turso.tech',
			installCLILink: 'https://docs.turso.tech/cli/installation',
			loginsignupLink: 'https://docs.turso.tech/cli/authentication',
		},
		web: {
			sponsorLink: 'https://turso.tech',
		},
		// TODO: Add Turso specific links when they are provided to us.
		// Also, switch to utilizing these new links within the websites.
	},
};

export default sponsors;
