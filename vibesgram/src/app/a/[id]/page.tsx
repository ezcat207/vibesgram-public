import { ArtifactActions } from "@/components/artifact/artifact-actions";
import { MainLayout } from "@/components/layout/main-layout";
import { UrlDisplay } from "@/components/shared/url-display";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Card, CardContent } from "@/components/ui/card";
import { getArtifactUrl, getCoverImageUrl } from "@/lib/paths";
import { api } from "@/trpc/server";
import Link from "next/link";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const artifact = await api.artifact.getArtifactById({ artifactId: id });

    return {
        title: `${artifact.title} - Vibesgram, vibe coder's gallery`,
        description: artifact.description?.slice(0, 155) || "Deploy your vibe code and get a shareable link, free no signup!",
        openGraph: {
            title: `${artifact.title} - Vibesgram, vibe coder's gallery`,
            description: artifact.description?.slice(0, 155) || "Deploy your vibe code and get a shareable link, free no signup!",
            ...(artifact.coverImagePath && {
                images: [{ url: getCoverImageUrl(artifact.coverImagePath) }],
            }),
        },
        alternates: {
            canonical: `https://vibesgram.com/a/${id}`
        },
    };
}

export default async function ArtifactPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const artifact = await api.artifact.getArtifactById({ artifactId: id });
        const artifactUrl = getArtifactUrl(id);

        if (!artifact) {
            notFound();
        }

        return (
            <MainLayout>
                <div className="mx-auto max-w-4xl">
                    <Breadcrumb className="mb-4">
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/">Home</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Artifact</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>

                    <Card className="w-full mb-20">
                        <CardContent className="p-6">
                            <div className="flex flex-wrap items-start justify-between gap-4 mb-2">
                                <h1 className="text-2xl font-bold">{artifact.title}</h1>
                                <Link href={`/u/${artifact.user.username}`} className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <img
                                        src={artifact.user.image ?? "/default-avatar.png"}
                                        alt={artifact.user.name ?? "Anonymous"}
                                        className="w-6 h-6 rounded-full"
                                    />
                                    <span>{artifact.user.name ?? "Anonymous"}</span>
                                </Link>
                            </div>

                            <div className="mb-4">
                                <UrlDisplay url={artifactUrl} />
                            </div>

                            <div className="aspect-video w-full bg-gray-100 overflow-hidden">
                                <iframe
                                    src={artifactUrl}
                                    className="w-full h-full border-0"
                                    sandbox="allow-scripts allow-same-origin"
                                />
                            </div>

                            {artifact.description && (
                                <div className="mt-6">
                                    <p className="text-muted-foreground whitespace-pre-wrap">
                                        {artifact.description}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <ArtifactActions
                        artifactId={artifact.id}
                        userId={artifact.user.id}
                        initialLikeCount={artifact.likeCount}
                    />
                </div>
            </MainLayout>
        );
    } catch (error) {
        console.error(error);
        notFound();
    }
}
