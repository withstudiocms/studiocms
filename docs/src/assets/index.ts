// Image type for Gallery component used to ensure all images are imported correctly from this file.
import type { Props as GalleryProps } from '~/components/Gallery.astro';
type ImageArrayType = GalleryProps['galleryImages'];

import contentMngmtDark from './dashboard/content-mngmt-dark.png';
import contentMngmtLight from './dashboard/content-mngmt-light.png';
import dashboardDark from './dashboard/dashboard-index-dark.png';
import dashboardLight from './dashboard/dashboard-index-light.png';
import loginDark from './dashboard/login-dark.png';
import loginLight from './dashboard/login-light.png';
import siteConfigDark from './dashboard/site-config-dark.png';
import siteConfigLight from './dashboard/site-config-light.png';
import userMngmtDark from './dashboard/user-mngmt-dark.png';
import userMngmtLight from './dashboard/user-mngmt-light.png';
import userProfileDark from './dashboard/user-profile-dark.png';
import userProfileLight from './dashboard/user-profile-light.png';

export const mainDemoGalleryImages: ImageArrayType = [
	{ imageMetadata: loginDark, alt: 'Login Page (Dark Mode)' },
	{ imageMetadata: loginLight, alt: 'Login Page (Light Mode)' },
	{ imageMetadata: dashboardDark, alt: 'Dashboard (Dark Mode)' },
	{ imageMetadata: dashboardLight, alt: 'Dashboard (Light Mode)' },
	{ imageMetadata: contentMngmtDark, alt: 'Content Management (Dark Mode)' },
	{ imageMetadata: contentMngmtLight, alt: 'Content Management (Light Mode)' },
	{ imageMetadata: siteConfigDark, alt: 'Site Configuration (Dark Mode)' },
	{ imageMetadata: siteConfigLight, alt: 'Site Configuration (Light Mode)' },
	{ imageMetadata: userMngmtDark, alt: 'User Management (Dark Mode)' },
	{ imageMetadata: userMngmtLight, alt: 'User Management (Light Mode)' },
	{ imageMetadata: userProfileDark, alt: 'User Profile (Dark Mode)' },
	{ imageMetadata: userProfileLight, alt: 'User Profile (Light Mode)' },
];

// Web-Vitals Images
import AnalyticsDark from './web-vitals/cv-analytics-dark.png';
import AnalyticsLight from './web-vitals/cv-analytics-light.png';
import ByRouteDark from './web-vitals/cv-byroute-dark.png';
import ByRouteLight from './web-vitals/cv-byroute-light.png';
import CoreWebVitalsDark from './web-vitals/cv-progressbars-dark.png';
import CoreWebVitalsLight from './web-vitals/cv-progressbars-light.png';
import PageSpeedDark from './web-vitals/pagespeed-dark.png';
import PageSpeedLight from './web-vitals/pagespeed-light.png';

export const webVitalsImages: ImageArrayType = [
	{ imageMetadata: AnalyticsDark, alt: 'Web Vitals Page Route Analytics (Dark Mode)' },
	{ imageMetadata: AnalyticsLight, alt: 'Web Vitals Page Route Analytics (Light Mode)' },
	{ imageMetadata: CoreWebVitalsDark, alt: 'Web Vitals Core Web Vitals (Dark Mode)' },
	{ imageMetadata: CoreWebVitalsLight, alt: 'Web Vitals Core Web Vitals (Light Mode)' },
	{ imageMetadata: ByRouteDark, alt: 'Web Vitals Core Vitals By Route (Dark Mode)' },
	{ imageMetadata: ByRouteLight, alt: 'Web Vitals Core Vitals By Route (Light Mode)' },
	{ imageMetadata: PageSpeedDark, alt: 'Web Vitals Page Speed (Dark Mode)' },
	{ imageMetadata: PageSpeedLight, alt: 'Web Vitals Page Speed (Light Mode)' },
];
