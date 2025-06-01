/**
 * Cloudflare Worker for serving preview and published artifacts
 *
 * This worker routes requests with the format:
 * - preview-{artifactId}.vibesgram.app -> preview content in R2
 * - {artifactId}.vibesgram.app -> published content in R2
 */

import { injectVibesgramComponent } from './injector';

export interface Env {
	BUCKET: R2Bucket;
	ASSETS_URL: string;
	APP_DOMAIN: string;
}

// Helper function to determine request type and extract artifactId
function parseRequest(host: string): { type: 'preview' | 'published' | null; artifactId: string | null } {
	if (!host) {
		return { type: null, artifactId: null };
	}

	const subdomain = host.split('.')[0];

	// Handle preview-{artifactId} subdomains
	if (subdomain.startsWith('preview-')) {
		return {
			type: 'preview',
			artifactId: subdomain.replace('preview-', ''),
		};
	}

	// Handle {artifactId} subdomains (published artifacts)
	// Exclude known non-artifact subdomains if needed
	const nonArtifactSubdomains = ['www', 'api', 'app'];
	if (!nonArtifactSubdomains.includes(subdomain)) {
		return {
			type: 'published',
			artifactId: subdomain,
		};
	}

	return { type: null, artifactId: null };
}

// Helper function to construct the R2 path
function getR2Path(type: 'preview' | 'published', artifactId: string, pathname: string): string {
	// Base path differs based on type
	const basePath = type === 'preview' ? `preview/${artifactId}/content` : `public/${artifactId}/content`;

	// Add index.html to paths ending with /
	let path = `${basePath}${pathname}`;
	return path.endsWith('/') ? path + 'index.html' : path;
}

/**
 * Check if the requested file is an HTML file
 * Checks both file extension and content-type header for more reliable detection
 */
function isHtmlFile(path: string, contentType?: string): boolean {
	// Check file extension first
	const hasHtmlExtension = path.toLowerCase().endsWith('.html') || path.toLowerCase().endsWith('.htm');

	// Check content type if available
	const hasHtmlContentType = contentType?.includes('text/html') || false;

	// If path ends with / or has no extension, it's likely an HTML file (like index.html)
	const isImplicitHtml = path.endsWith('/') || !path.includes('.');

	// Return true if any condition is met
	return hasHtmlExtension || hasHtmlContentType || isImplicitHtml;
}

// Helper function to serve content from R2
async function serveFromR2(env: Env, path: string, artifactId: string, type: 'preview' | 'published'): Promise<Response> {
	const object = await env.BUCKET.get(path.replace(/^\/+/, ''));

	if (!object) {
		return new Response('Not Found', { status: 404 });
	}

	// Set appropriate headers
	const headers = new Headers({
		'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
	});

	// Set cache based on content type and file extension
	const isHtml = isHtmlFile(path, object.httpMetadata?.contentType);
	if (isHtml) {
		headers.set('Cache-Control', 'public, max-age=60'); // 1 minute for HTML
	} else {
		headers.set('Cache-Control', 'public, max-age=300'); // 5 minutes for static assets
	}

	// Get the response body
	let body = await object.arrayBuffer();

	// Process HTML content: inject our component if it's an HTML file
	if (isHtml) {
		// Convert ArrayBuffer to text
		const htmlText = new TextDecoder().decode(body);

		// Only inject if the file actually contains HTML structure
		if (htmlText.includes('<html') && htmlText.includes('</body>')) {
			// Inject our component into the HTML
			const injectedHtml = injectVibesgramComponent(htmlText, {
				position: 'bottom-right',
				margin: 20,
				artifactId: artifactId,
				assetsUrl: env.ASSETS_URL,
				appDomain: env.APP_DOMAIN,
				type: type
			});

			// Convert back to ArrayBuffer
			body = new TextEncoder().encode(injectedHtml);
		}
	}

	return new Response(body, { headers });
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		try {
			const host = request.headers.get('host') || '';
			const url = new URL(request.url);

			// Parse the request to determine type and artifactId
			const { type, artifactId } = parseRequest(host);

			// Return early if invalid request
			if (!type || !artifactId) {
				return new Response('Not Found', { status: 404 });
			}

			// Get the R2 path for the requested content
			const r2Path = getR2Path(type, artifactId, url.pathname);

			// Serve the content from R2 with injected component for HTML
			return await serveFromR2(env, r2Path, artifactId, type);
		} catch (error) {
			console.error('Worker error:', error);
			return new Response('Internal Server Error', { status: 500 });
		}
	},
} satisfies ExportedHandler<Env>;
