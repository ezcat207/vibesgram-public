import { createTRPCRouter, protectedProcedure, publicProcedure } from "@/server/api/trpc";
import { db } from "@/server/db";
import { TRPCError } from "@trpc/server";
import { getUserLikesSchema, toggleLikeSchema } from "./schema";

export const likeRouter = createTRPCRouter({
    // Toggle like status (like/unlike)
    toggle: protectedProcedure
        .input(toggleLikeSchema)
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id;

            // First, check if the artifact exists
            const artifact = await db.artifact.findUnique({
                where: { id: input.artifactId, deletedAt: null },
            });

            if (!artifact) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Artifact not found",
                });
            }

            // Try to find existing like
            const existingLike = await db.like.findUnique({
                where: {
                    userId_artifactId: {
                        userId,
                        artifactId: input.artifactId,
                    },
                },
            });

            if (!existingLike) {
                // Create new like
                const [, updatedArtifact] = await db.$transaction([
                    db.like.create({
                        data: {
                            userId,
                            artifactId: input.artifactId,
                        },
                    }),
                    db.artifact.update({
                        where: { id: input.artifactId },
                        data: {
                            likeCount: {
                                increment: 1,
                            },
                        },
                    }),
                ]);

                return {
                    liked: true,
                    likeCount: updatedArtifact.likeCount,
                };
            } else {
                // Toggle existing like
                const newCancelledState = !existingLike.cancelled;

                const [, updatedArtifact] = await db.$transaction([
                    db.like.update({
                        where: { id: existingLike.id },
                        data: {
                            cancelled: newCancelledState,
                        },
                    }),
                    db.artifact.update({
                        where: { id: input.artifactId },
                        data: {
                            likeCount: {
                                increment: newCancelledState ? -1 : 1,
                            },
                        },
                    }),
                ]);

                return {
                    liked: !newCancelledState,
                    likeCount: updatedArtifact.likeCount,
                };
            }
        }),

    // Get user's likes with pagination
    getUserLikes: publicProcedure
        .input(getUserLikesSchema)
        .query(async ({ ctx, input }) => {
            const { userId } = input;

            const likes = await db.like.findMany({
                where: {
                    userId,
                    cancelled: false,
                },
                take: input.limit + 1,
                ...(input.cursor && {
                    cursor: {
                        id: input.cursor,
                    },
                }),
                orderBy: {
                    createdAt: "desc",
                },
                include: {
                    artifact: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    name: true,
                                    image: true,
                                    username: true,
                                },
                            },
                        },
                    },
                },
            });

            // Check if there are more results
            let nextCursor: string | undefined;
            if (likes.length > input.limit) {
                const nextItem = likes.pop();
                nextCursor = nextItem?.id;
            }

            return {
                items: likes,
                nextCursor,
            };
        }),
});
