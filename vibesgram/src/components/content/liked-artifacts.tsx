"use client";

import { api } from "@/trpc/react";
import { useState } from "react";
import { ContentGrid } from "./base/content-grid";
import { LoadMore } from "./base/load-more";

interface LikedArtifactsProps {
    userId: string;
}

export function LikedArtifacts({ userId }: LikedArtifactsProps) {
    const [isLoading, setIsLoading] = useState(false);

    const { data, fetchNextPage, hasNextPage } = api.artifact.like.getUserLikes.useInfiniteQuery(
        {
            userId,
            limit: 6,
        },
        {
            getNextPageParam: (lastPage) => lastPage.nextCursor,
        }
    );

    const items = data?.pages.flatMap((page) => page.items.map(like => like.artifact)) ?? [];

    const handleLoadMore = async () => {
        setIsLoading(true);
        await fetchNextPage();
        setIsLoading(false);
    };

    return (
        <section id="user-liked-artifacts-section" className="py-4">
            <div className="container px-4 md:px-6">
                <h2 className="mb-6 text-center text-2xl font-bold tracking-tight sm:text-3xl md:text-left">
                    Liked Artifacts
                </h2>

                <ContentGrid items={items} />

                {hasNextPage && (
                    <LoadMore onClick={handleLoadMore} isLoading={isLoading} />
                )}
            </div>
        </section>
    );
} 