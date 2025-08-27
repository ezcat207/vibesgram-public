/**
 * V1 Preview API wrapper - Fast alternative to slow tRPC endpoint
 * Supports both file upload and HTML text input
 */

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */

export interface PreviewFile {
  path: string;
  content: string; // base64 encoded
  contentType: string;
}

export interface CreatePreviewInput {
  files: PreviewFile[];
}

export interface CreatePreviewResponse {
  preview: {
    id: string;
    fileSize: number;
    fileCount: number;
    createdAt: string;
    expiresAt: string;
  };
  previewExpiresAt: string;
}

export interface CreatePreviewError extends Error {
  data?: {
    code?: string;
    httpStatus?: number;
  };
}

interface V1ApiResponse {
  success: boolean;
  message?: string;
  code?: string;
  data?: {
    previewId: string;
    fileSize: number;
    fileCount: number;
    expiresAt: string;
  };
}


/**
 * Create preview using V1 API (fast, ~900ms)
 * Supports both file upload and HTML input formats
 */
export async function createPreview(input: CreatePreviewInput): Promise<CreatePreviewResponse> {
  const response = await fetch('/api/v1/preview/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  const data = await response.json() as V1ApiResponse;

  if (!response.ok) {
    const error = new Error(data.message || 'Failed to create preview') as CreatePreviewError;
    error.data = {
      code: data.code || 'UNKNOWN_ERROR',
      httpStatus: response.status,
    };
    throw error;
  }

  if (!data.success) {
    const error = new Error(data.message || 'Preview creation failed') as CreatePreviewError;
    error.data = {
      code: 'API_ERROR',
      httpStatus: response.status,
    };
    throw error;
  }

  if (!data.data) {
    throw new Error('Invalid API response: missing data');
  }

  // Transform V1 API response to match tRPC response format
  return {
    preview: {
      id: data.data.previewId,
      fileSize: data.data.fileSize,
      fileCount: data.data.fileCount,
      createdAt: new Date().toISOString(), // V1 doesn't return this, use current time
      expiresAt: data.data.expiresAt,
    },
    previewExpiresAt: data.data.expiresAt,
  };
}

/**
 * Create preview from HTML text (convenience wrapper)
 */
export async function createPreviewFromHtml(html: string): Promise<CreatePreviewResponse> {
  const response = await fetch('/api/v1/preview/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ html }), // V1 API supports direct HTML input
  });

  const data = await response.json() as V1ApiResponse;

  if (!response.ok) {
    const error = new Error(data.message || 'Failed to create preview') as CreatePreviewError;
    error.data = {
      code: data.code || 'UNKNOWN_ERROR',
      httpStatus: response.status,
    };
    throw error;
  }

  if (!data.success) {
    const error = new Error(data.message || 'Preview creation failed') as CreatePreviewError;
    error.data = {
      code: 'API_ERROR',
      httpStatus: response.status,
    };
    throw error;
  }

  if (!data.data) {
    throw new Error('Invalid API response: missing data');
  }

  // Transform V1 API response to match tRPC response format
  return {
    preview: {
      id: data.data.previewId,
      fileSize: data.data.fileSize,
      fileCount: data.data.fileCount,
      createdAt: new Date().toISOString(),
      expiresAt: data.data.expiresAt,
    },
    previewExpiresAt: data.data.expiresAt,
  };
}

/**
 * Hook-like interface for React components (matches tRPC useMutation interface)
 */
export function useCreatePreview() {
  return {
    mutate: createPreview,
    mutateAsync: createPreview,
    isPending: false, // V1 API is fast, no need for complex state management
    isError: false,
    isSuccess: false,
    error: null,
  };
}

/**
 * Hook for HTML preview creation
 */
export function useCreatePreviewFromHtml() {
  return {
    mutate: createPreviewFromHtml,
    mutateAsync: createPreviewFromHtml,
    isPending: false,
    isError: false,
    isSuccess: false,
    error: null,
  };
}