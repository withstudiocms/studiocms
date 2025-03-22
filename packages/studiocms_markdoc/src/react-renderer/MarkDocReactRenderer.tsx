import type React from 'react';

/**
 * React component for rendering generated MarkDoc React content within StudioCMS using the Astro Container API
 */
export function MarkDocReactRenderer({ children }: { children: React.ReactNode }) {
	return <>{children}</>;
}

export default MarkDocReactRenderer;
