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
