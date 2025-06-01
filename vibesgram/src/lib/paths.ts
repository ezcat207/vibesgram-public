import { env } from "@/env";

export function getPreviewStoragePath(id: string) {
    return `preview/${id}/content`;
}

export function getArtifactStoragePath(id: string) {
    return `public/${id}/content`;
}

// Generate preview URL for a given preview ID
export function getPreviewUrl(previewId: string): string {
    return `https://preview-${previewId}.${env.NEXT_PUBLIC_APP_DOMAIN}`;
}

export function getArtifactUrl(artifactId: string): string {
    return `https://${artifactId}.${env.NEXT_PUBLIC_APP_DOMAIN}`;
}

export function getCoverImageUrl(coverImagePath: string): string {
    return `${env.NEXT_PUBLIC_ASSETS_URL}/${coverImagePath}`;
}
