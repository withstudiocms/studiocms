
// Only allow the following identifiers for pages
export const allowedIdentifiers = ['studiocms/markdown'];

export function withinLast30Days(date: Date) {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
    return date > thirtyDaysAgo;
}

export function sorter(a: Date | null, b: Date | null) {
    if (!a && !b) {
        return 0;
    }

    if (!a) {
        a = new Date(0);
    }

    if (!b) {
        b = new Date(0);
    }

    return b.getTime() - a.getTime();
}