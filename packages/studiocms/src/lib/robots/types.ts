// Updates can be retrieved from: https://www.ditig.com/robots-txt-template
// Last update: 2023-03-15

export type SearchEngines = {
	// so.com chinese search engine
	360: '360Spider' | '360Spider-Image' | '360Spider-Video' | 'HaoSouSpider';
	// apple.com search engine
	Apple: 'Applebot' | 'AppleNewsBot';
	// baidu.com chinese search engine
	Baidu:
		| 'Baiduspider'
		| 'Baiduspider-image'
		| 'Baiduspider-mobile'
		| 'Baiduspider-news'
		| 'Baiduspider-video';
	// bing.com international search engine
	Bing: 'bingbot' | 'BingPreview' | 'msnbot' | 'msnbot-media' | 'adidxbot' | 'MSN';
	// bublup.com suggestion/search engine
	Bublup: 'BublupBot';
	// cliqz.com german in-product search engine
	Cliqz: 'Cliqzbot';
	// coccoc.com vietnamese search engine
	Coccoc: 'coccoc' | 'coccocbot-image' | 'coccocbot-web';
	// daum.net korean search engine
	Daumoa: 'Daumoa';
	// dazoo.fr french search engine
	Dazoo: 'DeuSu';
	// duckduckgo.com international privacy search engine
	Duckduckgo: 'DuckDuckBot' | 'DuckDuckGo-Favicons-Bot';
	// eurip.com european search engine
	Eurip: 'EuripBot';
	// exploratodo.com latin search engine
	Exploratodo: 'Exploratodo';
	// findx.com european search engine
	Findx: 'Findxbot';
	// goo.ne.jp japanese search engine
	Goo: 'gooblog' | 'ichiro';
	// google.com international search engine
	Google:
		| 'Googlebot'
		| 'Googlebot-Image'
		| 'Googlebot-Mobile'
		| 'Googlebot-News'
		| 'Googlebot-Video'
		| 'Mediapartners-Google'
		| 'AdsBot-Google'
		| 'AdsBot-Google-Mobile'
		| 'AdsBot-Google-Mobile-Apps'
		| 'Mediapartners-Google'
		| 'Storebot-Google'
		| 'Google-InspectionTool'
		| 'FeedFetcher-Google';
	// istella.it italian search engine
	Istella: 'istellabot';
	// jike.com / chinaso.com chinese search engine
	Jike: 'JikeSpider';
	// lycos.com & hotbot.com international search engine
	Lycos: 'Lycos';
	// mail.ru russian search engine
	Mail: 'Mail.Ru';
	// mojeek.com search engine
	Mojeek: 'MojeekBot';
	// orange.com international search engine
	Orange: 'OrangeBot';
	// botje.nl dutch search engine
	Botje: 'Plukkie';
	// qwant.com french search engine
	Qwant: 'Qwantify';
	// rambler.ru russian search engine
	Rambler: 'Rambler';
	// seznam.cz czech search engine
	Seznam: 'SeznamBot';
	// soso.com chinese search engine
	Soso: 'Sosospider';
	// yahoo.com international search engine
	Yahoo: 'Slurp';
	// sogou.com chinese search engine
	Sogou:
		| 'Sogou blog'
		| 'Sogou inst spider'
		| 'Sogou News Spider'
		| 'Sogou Orion spider'
		| 'Sogou spider2'
		| 'Sogou web spider';
	// sputnik.ru russian search engine
	Sputnik: 'SputnikBot';
	// ask.com international search engine
	Ask: 'Teoma';
	// wotbox.com international search engine
	Wortbox: 'wotbox';
	// yandex.com russian search engine
	Yandex: 'Yandex' | 'YandexMobileBot';
	// search.naver.com south korean search engine
	Naver: 'Yeti';
	// yioop.com international search engine
	Yioop: 'YioopBot';
	// yooz.ir iranian search engine
	Yooz: 'yoozBot';
	// youdao.com chinese search engine
	Youdao: 'YoudaoBot';
};

export type SocialNetwork = {
	// facebook.com social network
	Facebook: 'facebookcatalog' | 'facebookexternalhit' | 'Facebot';
	// pinterest.com social networtk
	Pinterest: 'Pinterest';
	// twitter.com social media bot
	Tittwer: 'Twitterbot';
	// whatsapp.com preview bot
	WhatsApp: 'WhatsApp';
	// linkedin.com search engine crawler
	LinkedIn: 'LinkedInBot';
};

export type SearchEngineOptimization = {
	Ahrefs: 'AhrefsBot';
	Moz: 'Moz dotbot' | 'Moz rogerbot';
	WebMeUp: 'BLEXBot';
	Botify: 'Botify';
	Babbar: 'Barkrowler';
	SEMrush: 'SEMrush' | 'SemrushBotSI';
	Cxense: 'Cxense';
	EzoicInc: 'EzoicBot';
	DataForSEO: 'DataForSEO';
	PrerenderLLC: 'prerender';
};

export type UserAgentType =
	| '*'
	| SearchEngines[keyof SearchEngines]
	| SocialNetwork[keyof SocialNetwork]
	| SearchEngineOptimization[keyof SearchEngineOptimization];

export interface RobotsConfig {
	/**
	 * @default false
	 * @description
	 * [ Optional ] Some crawlers(Yandex) support and only accept domain names.
	 * @example
	 * ```ts
	 * integrations:[
	 *  robots({
	 *    host: siteUrl.replace(/^https?:\/\/|:\d+/g, "")
	 *  })
	 * ]
	 * ```
	 */
	host?: boolean | string;
	/**
	 * @description
	 * [ Optional, zero or more per file ] The location of a sitemap for this website.
	 * @example
	 * ```ts
	 * sitemap: [
	 *  "https://example.com/sitemap.xml",
	 *  "https://www.example.com/sitemap.xml"
	 * ]
	 * ```
	 * The value of the [SITEMAP](https://developers.google.com/search/docs/crawling-indexing/robots/robots_txt#sitemap) field is case-sensitive.
	 */
	sitemap?: boolean | string | string[];
	/**
	 * @description
	 * [ Optional ] List of `policy` rules.
	 * @default
	 * ```ts
	 * policy:[
	 *  {
	 *    userAgent: "*",
	 *    allow: "/"
	 *  }
	 * ]
	 * ```
	 * For more help, refer to [SYNTAX](https://yandex.com/support/webmaster/controlling-robot/robots-txt.html#recommend) by Yandex.
	 */
	policy?: PolicyOptions[] | undefined;
}

export interface PolicyOptions {
	/**
	 * @description
	 * [ Required ] Indicates the robot to which the rules listed in `robots.txt` apply.
	 * @example
	 * ```ts
	 * policy:[
	 *  {
	 *    userAgent: [
	 *      'Googlebot',
	 *      'Applebot',
	 *      'Baiduspider',
	 *      'bingbot'
	 *    ],
	 *    // crawling rule(s) for above bots
	 *  }
	 * ]
	 * ```
	 * Verified bots, refer to [DITIG](https://www.ditig.com/robots-txt-template#regular-template) or [Cloudflare Radar](https://radar.cloudflare.com/traffic/verified-bots).
	 */
	userAgent?: UserAgentType | UserAgentType[];
	/**
	 * @description
	 * [ At least one or more `allow` or `disallow` entries per rule ] Allows indexing site sections or individual pages.
	 * @example
	 * ```ts
	 * policy:[{allow:["/"]}]
	 * ```
	 * Path-based URL matching, refer to [SYNTAX](https://developers.google.com/search/docs/crawling-indexing/robots/robots_txt#url-matching-based-on-path-values) via Google.
	 */
	allow?: string | string[];
	/**
	 * @description
	 * [ At least one or more `disallow` or `allow` entries per rule ] Prohibits indexing site sections or individual pages.
	 * @example
	 * ```ts
	 * policy:[
	 *  {
	 *    disallow:[
	 *      "/admin",
	 *      "/uploads/1989-08-21/*.jpg$"
	 *    ]
	 *  }
	 * ]
	 * ```
	 * Path-based URL matching, refer to [SYNTAX](https://developers.google.com/search/docs/crawling-indexing/robots/robots_txt#url-matching-based-on-path-values) via Google.
	 */
	disallow?: string | string[];
	/**
	 * @description
	 * [ Optional ] Specifies the minimum interval (in seconds) for the search robot to wait after loading one page, before starting to load another.
	 *
	 * @example
	 * ```ts
	 * policy:[{crawlDelay:5}]
	 * ```
	 * About the [Crawl-delay](https://yandex.com/support/webmaster/robot-workings/crawl-delay.html#crawl-delay) directive.
	 */
	crawlDelay?: number;
	/**
	 * @description
	 * [ Optional ] Indicates to the robot that the page URL contains parameters (like UTM tags) that should be ignored when indexing it.
	 *
	 * @example
	 * ```bash
	 * # for URLs like:
	 * www.example2.com/index.php?page=1&sid=2564126ebdec301c607e5df
	 * www.example2.com/index.php?page=1&sid=974017dcd170d6c4a5d76ae
	 * ```
	 * ```ts
	 * policy:[
	 *  {
	 *    cleanParam: [
	 *      "sid /index.php",
	 *    ]
	 *  }
	 * ]
	 * ```
	 * For additional examples, please consult
	 * Yandex's [SYNTAX](https://yandex.com/support/webmaster/robot-workings/clean-param.html#clean-param__additional) guide.
	 */
	cleanParam?: string | string[];
}
