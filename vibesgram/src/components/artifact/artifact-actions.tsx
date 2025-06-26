'use client';

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLike } from "@/hooks/use-like";
import { toast } from "@/hooks/use-toast";
import { getArtifactUrl } from "@/lib/paths";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";
import { ExternalLink, Heart, Link2, Share, Trash2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface ArtifactActionsProps {
    artifactId: string;
    userId: string;
    initialLikeCount: number;
}

export function ArtifactActions({ artifactId, initialLikeCount, userId }: ArtifactActionsProps) {
    const { data: session } = useSession();
    const router = useRouter();
    const artifactUrl = getArtifactUrl(artifactId);
    const { likeCount, isLoading: isLikeLoading, handleLike } = useLike(artifactId, initialLikeCount);
    const isOwner = session?.user.id === userId;
    const [isDeleting, setIsDeleting] = useState(false);

    const deleteArtifactMutation = api.artifact.deleteArtifact.useMutation({
        onSuccess: () => {
            setIsDeleting(false);
            toast({
                title: "Artifact deleted",
                description: "The artifact has been deleted successfully",
            });
            router.push("/");
        },
        onError: (error) => {
            setIsDeleting(false);
            toast({
                title: "Failed to delete",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const createCheckout = api.payment.createStripeCheckoutSession.useMutation();
    const handleDonate = async (amount: number) => {
        const res = await createCheckout.mutateAsync({ artifactId, amount });
        if (res.url) {
            window.open(res.url, '_blank');
        }
    };

    const handleShare = async () => {
        try {
            await navigator.share({
                title: document.title,
                url: window.location.href,
            });
        } catch {
            await navigator.clipboard.writeText(window.location.href);
            toast({
                title: "Link copied",
                description: "The link has been copied to your clipboard",
            });
        }
    };

    const handleCopyLink = async () => {
        await navigator.clipboard.writeText(artifactUrl);
        toast({
            title: "Link copied",
            description: "The link has been copied to your clipboard",
        });
    };

    const handleDelete = async () => {
        if (isDeleting) return;
        setIsDeleting(true);
        deleteArtifactMutation.mutate({ artifactId });
    };

    const ActionButton = ({ icon: Icon, label, onClick, href, disabled }: {
        icon: typeof Heart;
        label: string;
        onClick?: () => void;
        href?: string;
        disabled?: boolean;
    }) => {
        const content = (
            <>
                <Icon className={cn("h-6 w-6 md:h-4 md:w-4", disabled && "animate-pulse")} />
                <span className="text-sm">{label}</span>
            </>
        );

        if (href) {
            return (
                <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col md:flex-row md:gap-2 items-center"
                >
                    {content}
                </a>
            );
        }

        return (
            <button
                className="flex flex-col md:flex-row md:gap-2 items-center disabled:opacity-50"
                onClick={onClick}
                disabled={disabled}
            >
                {content}
            </button>
        );
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm border-t p-4">
            <div className="flex justify-around md:justify-end md:gap-8 items-center max-w-4xl mx-auto">
                <ActionButton
                    icon={Heart}
                    label={`Like${likeCount ? ` (${likeCount})` : ""}`}
                    onClick={handleLike}
                    disabled={isLikeLoading}
                />
                <button
                    onClick={() => handleDonate(1)}
                    className="flex flex-col md:flex-row md:gap-2 items-center"
                >
                    <span className="inline-block bg-yellow-400 text-black rounded px-2 py-1 text-xs font-bold">Donate $1</span>
                </button>
                <button
                    onClick={() => handleDonate(10)}
                    className="flex flex-col md:flex-row md:gap-2 items-center"
                >
                    <span className="inline-block bg-yellow-500 text-black rounded px-2 py-1 text-xs font-bold">Donate $10</span>
                </button>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="flex flex-col md:flex-row md:gap-2 items-center">
                            <Share className="h-6 w-6 md:h-4 md:w-4" />
                            <span className="text-sm">Share</span>
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={handleShare}>
                            <Share className="mr-2 h-4 w-4" />
                            Share
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleCopyLink}>
                            <Link2 className="mr-2 h-4 w-4" />
                            Copy link
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                <ActionButton
                    icon={ExternalLink}
                    label="Open"
                    href={artifactUrl}
                />
                {isOwner && (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <ActionButton
                                icon={Trash2}
                                label="Delete"
                                disabled={isDeleting}
                            />
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete your artifact
                                    and remove the data from our servers.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={handleDelete}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    disabled={isDeleting}
                                >
                                    {isDeleting ? "Deleting..." : "Delete"}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
            </div>
        </div>
    );
} 