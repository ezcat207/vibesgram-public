import { api } from "@/trpc/react";
import { signIn, useSession } from "next-auth/react";
import { useState } from "react";
import { useToast } from "./use-toast";

export function useLike(artifactId: string, initialLikeCount: number) {
    const { data: session } = useSession();
    const [likeCount, setLikeCount] = useState(initialLikeCount);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const utils = api.useUtils();

    const toggleLike = api.artifact.like.toggle.useMutation({
        onMutate: async () => {
            // Store the current like count for rollback
            const previousCount = likeCount;
            return { previousCount };
        },
        onSuccess: (data) => {
            // Use the server-returned like count
            setLikeCount(data.likeCount);
            if (data.liked) {
                toast({
                    title: "Liked",
                    description: "You can see all your liked artifacts in your profile",
                });
            } else {
                toast({
                    title: "Unliked",
                    description: "This artifact is no longer in your liked list",
                });
            }
        },
        onError: (error, _, context) => {
            // Revert to the previous count on error
            if (context) {
                setLikeCount(context.previousCount);
            }
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        },
        onSettled: () => {
            // Invalidate relevant queries to get fresh data
            void utils.artifact.getArtifacts.invalidate();
            void utils.artifact.getArtifactById.invalidate({ artifactId });
        },
    });

    const handleLike = async () => {
        if (isLoading) return;

        if (!session) {
            void signIn("google");
            return;
        }

        setIsLoading(true);
        try {
            await toggleLike.mutateAsync({ artifactId });
        } finally {
            setIsLoading(false);
        }
    };

    return {
        likeCount,
        isLoading,
        handleLike,
        isAuthenticated: !!session,
    };
} 