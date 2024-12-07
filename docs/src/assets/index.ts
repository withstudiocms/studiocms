// Image type for Gallery component used to ensure all images are imported correctly from this file.
import type { Props as GalleryProps } from '~/components/Gallery.astro';
type ImageArrayType = GalleryProps['galleryImages'];

import CreateNewPageDark from './gallery/CreateNewPageDark.png';
import CreateNewPageLight1 from './gallery/CreateNewPageLight-1.png';
import CreateNewPageLight2 from './gallery/CreateNewPageLight-2.png';
import DashboardDark from './gallery/DashboardDark.png';
import DashboardLight from './gallery/DashboardLight.png';
import EditPageDark1 from './gallery/EditPageDark-1.png';
import EditPageDark2 from './gallery/EditPageDark-2.png';
import EditPageLight1 from './gallery/EditPageLight-1.png';
import EditPageLight2 from './gallery/EditPageLight-2.png';
// Gallery Images
import LoginPageDark from './gallery/LoginPageDark.png';
import LoginPageLight from './gallery/LoginPageLight.png';
import SiteAdminsDark from './gallery/SiteAdminsDark.png';
import SiteConfigDark from './gallery/SiteConfigDark.png';
import UserProfileDark from './gallery/UserProfileDark.png';
import UserProfileLight from './gallery/UserProfileLight.png';

export const mainDemoGalleryImages: ImageArrayType = [
	{ imageMetadata: LoginPageDark, alt: 'Login Page Dark' },
	{ imageMetadata: LoginPageLight, alt: 'Login Page Light' },
	{ imageMetadata: CreateNewPageDark, alt: 'Create New Page Dark' },
	{ imageMetadata: CreateNewPageLight1, alt: 'Create New Page Light 1' },
	{ imageMetadata: CreateNewPageLight2, alt: 'Create New Page Light 2' },
	{ imageMetadata: DashboardDark, alt: 'Dashboard Dark' },
	{ imageMetadata: DashboardLight, alt: 'Dashboard Light' },
	{ imageMetadata: EditPageDark1, alt: 'Edit Page Dark 1' },
	{ imageMetadata: EditPageDark2, alt: 'Edit Page Dark 2' },
	{ imageMetadata: EditPageLight1, alt: 'Edit Page Light 1' },
	{ imageMetadata: EditPageLight2, alt: 'Edit Page Light 2' },
	{ imageMetadata: SiteAdminsDark, alt: 'Site Admins Dark' },
	{ imageMetadata: SiteConfigDark, alt: 'Site Config Dark' },
	{ imageMetadata: UserProfileDark, alt: 'User Profile Dark' },
	{ imageMetadata: UserProfileLight, alt: 'User Profile Light' },
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
