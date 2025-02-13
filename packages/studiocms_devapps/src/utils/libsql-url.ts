const sqlLiteUrl = 'https://studio.outerbase.com/embed/sqlite?theme=dark';
const tursoURL = 'https://studio.outerbase.com/embed/turso?theme=dark';

const tursoDomain = 'turso.io';

export function getIFrameSrc(dbUrl: string) {
	if (dbUrl.includes(tursoDomain)) {
		return tursoURL;
	}
	return sqlLiteUrl;
}
