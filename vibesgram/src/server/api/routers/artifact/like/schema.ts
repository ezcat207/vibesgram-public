import { z } from "zod";

// Input schema for toggling like status
export const toggleLikeSchema = z.object({
    artifactId: z.string(),
});

// Input schema for getting user likes
export const getUserLikesSchema = z.object({
    userId: z.string(),
    limit: z.number().min(1).max(100).default(20),
    cursor: z.string().optional(),
});

// Output type for a like item
export type LikeItem = {
    id: string;
    createdAt: Date;
    cancelled: boolean;
    artifact: {
        id: string;
        title: string;
        coverImageUrl: string | null;
        likeCount: number;
        user: {
            name: string | null;
            image: string | null;
            username: string | null;
        };
    };
};
