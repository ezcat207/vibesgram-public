import { z } from 'zod';

export const ScreenshotRequestSchema = z.object({
    url: z.string().url(),
    width: z.number().int().positive().default(900),
    height: z.number().int().positive().default(1200),
});

export const ScreenshotResponseSchema = z.object({
    success: z.boolean(),
    data: z.string(),  // base64 string
});

export const ErrorResponseSchema = z.object({
    error: z.string(),
    details: z.string().optional(),
});

export type ScreenshotRequest = z.infer<typeof ScreenshotRequestSchema>;
export type ScreenshotResponse = z.infer<typeof ScreenshotResponseSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>; 