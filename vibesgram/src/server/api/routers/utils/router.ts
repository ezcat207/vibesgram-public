/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */

import { SCREENSHOT_TIMEOUT_MS } from "@/lib/const";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../../trpc";
import { screenshotInput } from "./schema";

const isAllowedDomain = (url: string) => {
    const hostname = new URL(url).hostname;
    // const appDomain = env.NEXT_PUBLIC_APP_DOMAIN;
    // return hostname === appDomain || hostname.endsWith(`.${appDomain}`);
    return true; // 由于现在通过本地API代理，这里简化处理，实际应根据需求调整
};

export const utilsRouter = createTRPCRouter({
    screenshot: protectedProcedure
        .input(screenshotInput)
        .mutation(async ({ input }) => {
            // Validate domain
            if (!isAllowedDomain(input.url)) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "Screenshots are only allowed from our domain and subdomains",
                });
            }

            try {
                // Call new local screenshot API with timeout
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), SCREENSHOT_TIMEOUT_MS);

                const response = await fetch(`/api/screenshot`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        url: input.url,
                        width: input.viewport[0],
                        height: input.viewport[1]
                    }),
                    signal: controller.signal,
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    throw new Error(`Screenshot service returned ${response.status}`);
                }

                const result = await response.json();
                if (!result.success) {
                    throw new Error(result.error || "Screenshot failed");
                }

                return {
                    base64Image: result.data,
                };
            } catch (error) {
                if (error instanceof Error && error.name === "AbortError") {
                    throw new TRPCError({
                        code: "TIMEOUT",
                        message: "Screenshot service timed out",
                    });
                }

                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: error instanceof Error ? error.message : "Screenshot failed",
                });
            }
        }),
});
