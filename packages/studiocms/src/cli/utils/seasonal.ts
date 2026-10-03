interface SeasonalMessages {
	messages: string[];
}

export default function getSeasonalMessages(): SeasonalMessages {
	const season = getSeason();
	switch (season) {
		case 'new-year': {
			const year = new Date().getFullYear();
			return {
				messages: [
					`Welcome to StudioCMS! Let's create something amazing.`,
					`Kicking off ${year} with StudioCMS? You're in for a treat!`,
					`Happy ${year}! Ready to craft the perfect CMS?`,
					`${year} is your year to create something awesome with StudioCMS!`,
					`${year} is the year of StudioCMS-powered sites!`,
					`Excited to see what you'll build with StudioCMS in ${year}!`,
					`Thanks for choosing StudioCMS to start your ${year} journey!`,
				],
			};
		}
		case 'spooky':
			return {
				messages: [
					`Beware! You're entering the realm of StudioCMS.`,
					'Boo! Ready to create something frightfully good?',
					`Let's brew up a spooktacular website together!`,
					'No tricks, just treats with StudioCMS this Halloween.',
					'Spiders spin webs, but you build the internet with StudioCMS!',
					'StudioCMS: your cauldron for conjuring up the perfect site.',
					'A hauntingly beautiful project awaits you!',
					'The only thing spooky here is how good your site will look!',
					'Prepare for chills and thrills as we craft your CMS masterpiece!',
					'StudioCMS: Helping you scare up a perfect website this Halloween!',
				],
			};
		case 'holiday':
			return {
				messages: [
					`'Tis the season to build with StudioCMS!`,
					'Jingle all the way to your next great website!',
					'Deck the web with StudioCMS magic!',
					`Let's unwrap the gift of creativity together!`,
					'May your holidays be merry and your site extraordinary!',
					'Building a website is the best kind of holiday cheer!',
					'StudioCMS: the perfect companion for your festive projects!',
					'Create a winter wonderland online with StudioCMS.',
					`Ho ho ho! Let's build something unforgettable this holiday season!`,
					'Your ideas are the brightest stars on this holiday tree!',
				],
			};
		default:
			return {
				messages: [
					`Welcome to StudioCMS! Let's get started.`,
					'Ready to shape the future of the web with StudioCMS?',
					'Claim your digital space with StudioCMS!',
					'Time to turn your ideas into reality.',
					`Let's craft something amazing together!`,
					`Let's make the internet a better place.`,
					'Your creativity + StudioCMS = magic.',
					`We're thrilled to have you on this journey.`,
					'Building the web, one project at a time.',
					`The web is yours to shape. Let's begin!`,
					'Fast, flexible, and ready to go—just like StudioCMS.',
					`Let's build the CMS of your dreams!`,
					`Let's make your vision a reality.`,
					'Ready to create something extraordinary?',
					'Here to assist you in building greatness.',
					`It's time to create your next masterpiece.`,
					'StudioCMS: The power of the web in your hands.',
				],
			};
	}
}

type Season = 'spooky' | 'holiday' | 'new-year';
function getSeason(): Season | undefined {
	const date = new Date();
	const month = date.getMonth() + 1;
	const day = date.getDate() + 1;

	if (month === 1 && day <= 7) {
		return 'new-year';
	}
	if (month === 10 && day > 7) {
		return 'spooky';
	}
	if (month === 12 && day > 7 && day < 25) {
		return 'holiday';
	}
}
