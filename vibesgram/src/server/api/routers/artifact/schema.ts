import { z } from "zod";
import { RouterOutput } from "../../types";

export type PaginatedArtifacts = RouterOutput["artifact"]["getArtifacts"];
export type ArtifactItem = RouterOutput["artifact"]["getArtifacts"]["items"][number];

// Schema for getting artifacts with pagination
export const getArtifactsSchema = z.object({
  limit: z.number().min(1).max(100).default(10),
  cursor: z.string().optional(),
});

// Schema for updating artifact metadata
export const updateArtifactSchema = z.object({
  artifactId: z.string(),
  title: z
    .string()
    .min(1, "Title is required")
    .max(100, "Title too long")
    .optional(),
  description: z.string().max(500, "Description too long").optional(),
});

// Schema for a single file in the artifact content
export const artifactFileSchema = z.object({
  path: z.string().min(1, "File path is required"),
  content: z.string().min(1, "Content is required"),
  contentType: z.string().default("text/html"),
});

// Schema for creating a preview (without requiring an artifact)
export const createPreviewSchema = z.object({
  files: z.array(artifactFileSchema).min(1, "At least one file is required"),
});

// Schema for publishing from a preview
export const publishFromPreviewSchema = z.object({
  previewId: z.string(),
  title: z.string().min(1, "Title is required").max(100, "Title too long, max 100 characters"),
  description: z.string().max(500, "Description too long, max 500 characters"),
  coverImage: z.object({
    data: z.string(), // base64 encoded image data
    contentType: z.string(), // mime type
  }),
});

// Schema for getting artifact by ID
export const getArtifactByIdSchema = z.object({
  artifactId: z.string(),
});

// Schema for getting user's artifacts with pagination
export const getUserArtifactsSchema = z.object({
  userId: z.string(),
  limit: z.number().min(1).max(100).default(10),
  cursor: z.string().optional(),
});

// Schema for getting artifact by conversation ID
export const getArtifactByConversationIdSchema = z.object({
  conversationId: z.string(),
});
