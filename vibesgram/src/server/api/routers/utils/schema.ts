import { z } from "zod";

export const allowedViewports = [
    [600, 800],
    [900, 1200]
] as const;

export const screenshotInput = z.object({
    url: z.string().url(),
    viewport: z.tuple([z.number(), z.number()])
        .refine(
            (size) => allowedViewports.some(([w, h]) => size[0] === w && size[1] === h),
            (val) => ({ message: `Viewport must be one of: ${allowedViewports.map(([w, h]) => `${w}x${h}`).join(', ')}` })
        )
        .default(() => [600, 800] as [number, number]),
});

export const screenshotOutput = z.object({
    base64Image: z.string(),
});

export type ScreenshotInput = z.infer<typeof screenshotInput>;
export type ScreenshotOutput = z.infer<typeof screenshotOutput>;
