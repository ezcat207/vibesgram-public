import { format } from "date-fns";
import { notFound } from "next/navigation";

import { LikedArtifacts } from "@/components/content/liked-artifacts";
import { UserArtifacts } from "@/components/content/user-artifacts";
import { MainLayout } from "@/components/layout/main-layout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { api } from "@/trpc/server";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const user = await api.user.getByUsername(id)

    return {
        title: `${user.name} (@${user.username}) - Vibesgram, vibe coder's gallery`,
        description: `Explore ${user.name} (@${user.username})'s vibe coding creations on Vibesgram`,
        openGraph: {
            title: `${user.name} (@${user.username}) - Vibesgram, vibe coder's gallery`,
            description: `Explore ${user.name} (@${user.username})'s vibe coding creations on Vibesgram`,
            ...(user.image && {
                images: [{ url: user.image }],
            }),
        },
        alternates: {
            canonical: `https://vibesgram.app/u/${id}`
        },
    };
}

export default async function UserProfilePage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const user = await api.user.getByUsername(id)

    if (!user?.username) {
        notFound();
    }

    return (
        <MainLayout>
            <div className="container mx-auto px-4 py-8">
                <Breadcrumb className="mb-4">
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/">Home</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>Profile</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>

                <div className="mb-8 flex items-start gap-6">
                    <Avatar className="h-24 w-24">
                        <AvatarImage src={user.image ?? ""} alt={user.name ?? ""} />
                        <AvatarFallback>{user.name?.[0] ?? user.username[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                        <h1 className="text-2xl font-bold">{user.name}</h1>
                        <p className="text-muted-foreground">@{user.username}</p>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Joined {format(user.createdAt, "MMMM yyyy")}
                        </p>
                    </div>
                </div>

                <UserArtifacts userId={user.id} />
                <LikedArtifacts userId={user.id} />
            </div>
        </MainLayout>
    );
}
