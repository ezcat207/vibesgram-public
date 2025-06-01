"use client";

import { api } from "@/trpc/react";
import { useState } from "react";
import { ContentGrid } from "./base/content-grid";
import { LoadMore } from "./base/load-more";

export function LatestArtifact() {
    const [isLoading, setIsLoading] = useState(false);

    const { data, fetchNextPage, hasNextPage } = api.artifact.getArtifacts.useInfiniteQuery(
        {
            limit: 6,
        },
        {
            getNextPageParam: (lastPage) => lastPage.nextCursor,
        }
    );

    // Use the items directly from the API response
    const items = data?.pages.flatMap((page) => page.items) ?? [];

    const handleLoadMore = async () => {
        setIsLoading(true);
        await fetchNextPage();
        setIsLoading(false);
    };

    return (
        <section id="content-section" className="py-4">
            <div className="container px-4 md:px-6">
                <h2 className="mb-6 text-center text-2xl font-bold tracking-tight sm:text-3xl md:text-left">
                    Latest
                </h2>

                <ContentGrid items={items} />

                {hasNextPage && (
                    <LoadMore onClick={handleLoadMore} isLoading={isLoading} />
                )}
            </div>
        </section>
    );
}
