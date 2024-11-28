export { default as SponsorLink } from './util/SponsorLink.astro';

// This file is used to define the sponsors and their respective urls.
export const sponsors = {
	turso: {
		docs: {
			sidebarSponsorLink: 'https://tur.so/studiocms',
			installCLILink: 'https://docs.turso.tech/cli/installation',
			loginsignupLink: 'https://docs.turso.tech/cli/authentication',
		},
	},
};

export default sponsors;
