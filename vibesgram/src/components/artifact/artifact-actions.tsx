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
import { Progress } from "@/components/ui/progress";
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
import { DollarSign, ExternalLink, Heart, Link2, Share, Trash2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface ArtifactActionsProps {
    artifactId: string;
    userId: string;
    initialLikeCount: number;
    crowdfundingGoal?: number | null; // Optional crowdfunding goal
    currentCrowdfundingAmount?: number; // Current amount raised
}

export function ArtifactActions({
    artifactId,
    initialLikeCount,
    userId,
    crowdfundingGoal,
    currentCrowdfundingAmount = 0, // Default to 0 if not provided
}: ArtifactActionsProps) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const artifactUrl = getArtifactUrl(artifactId);
    const { likeCount, isLoading: isLikeLoading, handleLike } = useLike(artifactId, initialLikeCount);
    const isOwner = session?.user.id === userId;
    const [isDeleting, setIsDeleting] = useState(false);

    const crowdfundingProgress = crowdfundingGoal && crowdfundingGoal > 0
        ? Math.min((currentCrowdfundingAmount / crowdfundingGoal) * 100, 100)
        : 0;

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

    const handleShare = async () => {
        try {
            await navigator.share({
                title: document.title,
                url: window.location.href,
            });
        } catch (error) {
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
            {crowdfundingGoal && crowdfundingGoal > 0 && (
                <div className="max-w-4xl mx-auto mb-2 px-4 md:px-0">
                    <div className="flex justify-between text-sm mb-1">
                        <span>
                            Raised: <strong>${currentCrowdfundingAmount.toFixed(2)}</strong> / ${crowdfundingGoal.toFixed(2)}
                        </span>
                        <span>{crowdfundingProgress.toFixed(0)}%</span>
                    </div>
                    <Progress value={crowdfundingProgress} className="w-full h-2" />
                </div>
            )}
            <div className="flex justify-around md:justify-center md:gap-6 items-center max-w-4xl mx-auto">
                <ActionButton
                    icon={Heart}
                    label={`Like${likeCount ? ` (${likeCount})` : ""}`}
                    onClick={handleLike}
                    disabled={isLikeLoading}
                />
                <ActionButton
                    icon={DollarSign}
                    label="$1 Donate"
                    href="https://buy.stripe.com/test_14A3cxek54yb70E63yefC02"
                />
                <ActionButton
                    icon={DollarSign}
                    label="$10 Donate"
                    href="https://buy.stripe.com/test_28EaEZ2Bn1lZ1Gk4ZuefC01"
                />
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