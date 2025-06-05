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
import { Coins, ExternalLink, Heart, Link2, Share, Trash2 } from "lucide-react"; // Added Coins
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { loadStripe, Stripe } from "@stripe/stripe-js"; // New
import { env } from "@/env.js"; // New

// For the dialog/modal (assuming Shadcn UI components are used)
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button"; // Already imported but ensure it's available if not
import { Label } from "@/components/ui/label"; // If needed for the input

interface ArtifactActionsProps {
    artifactId: string;
    userId: string;
    initialLikeCount: number;
}

export function ArtifactActions({ artifactId, initialLikeCount, userId }: ArtifactActionsProps) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const artifactUrl = getArtifactUrl(artifactId);
    const { likeCount, isLoading: isLikeLoading, handleLike } = useLike(artifactId, initialLikeCount);
    const isOwner = session?.user.id === userId;
    const [isDeleting, setIsDeleting] = useState(false);

    // Stripe.js initialization
    let stripePromise: Promise<Stripe | null> | null = null;
    if (typeof window !== "undefined") { // Ensure it runs only on client-side
        stripePromise = loadStripe(env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
    }

    // State for dialog and amount
    const [showDonateDialog, setShowDonateDialog] = useState(false);
    const [donationAmount, setDonationAmount] = useState<string>("5"); // Default amount

    const createCheckoutSessionMutation = api.donation.createCheckoutSession.useMutation({
        onSuccess: async (data) => {
            const stripe = await stripePromise;
            if (stripe && data.url) {
                // Using data.url which is the direct checkout URL
                window.location.href = data.url;
            } else if (data.sessionId && stripe) {
                // Fallback or alternative: Redirect to Stripe Checkout page by session ID
                const { error } = await stripe.redirectToCheckout({ sessionId: data.sessionId });
                if (error) {
                    toast({
                        title: "Error redirecting to Stripe",
                        description: error.message,
                        variant: "destructive",
                    });
                }
            } else {
                 toast({
                    title: "Error",
                    description: "Could not initiate donation process.",
                    variant: "destructive",
                });
            }
        },
        onError: (error) => {
            toast({
                title: "Donation Error",
                description: error.message || "Could not process donation.",
                variant: "destructive",
            });
        },
        onSettled: () => {
            // Potentially close dialog or reset loading state here
            setShowDonateDialog(false);
        }
    });

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
            <div className="flex justify-around md:justify-end md:gap-8 items-center max-w-4xl mx-auto">
                <ActionButton
                    icon={Heart}
                    label={`Like${likeCount ? ` (${likeCount})` : ""}`}
                    onClick={handleLike}
                    disabled={isLikeLoading}
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

        {/* Donate Button and Dialog */}
        <Dialog open={showDonateDialog} onOpenChange={setShowDonateDialog}>
            <DialogTrigger asChild>
                <ActionButton
                    icon={Coins} // Or your chosen icon
                    label="Donate"
                    onClick={() => {
                        if (!session) { // Check if user is logged in
                            toast({ title: "Authentication Required", description: "Please log in to donate."});
                            // Optionally trigger signIn() here
                            return;
                        }
                        setShowDonateDialog(true);
                    }}
                />
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Make a Donation</DialogTitle>
                    <DialogDescription>
                        Support this artifact by making a donation. Minimum amount is $1.00.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="amount" className="text-right">
                            Amount (USD)
                        </Label>
                        <Input
                            id="amount"
                            type="number"
                            value={donationAmount}
                            onChange={(e) => setDonationAmount(e.target.value)}
                            className="col-span-3"
                            min="1"
                            step="1" // Or "0.01" if you allow cents directly in input
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        type="submit"
                        onClick={async () => {
                            const amountNumber = parseFloat(donationAmount);
                            if (isNaN(amountNumber) || amountNumber < 1) {
                                toast({
                                    title: "Invalid Amount",
                                    description: "Please enter a valid amount of at least $1.00.",
                                    variant: "destructive",
                                });
                                return;
                            }
                            createCheckoutSessionMutation.mutate({ artifactId, amount: amountNumber });
                        }}
                        disabled={createCheckoutSessionMutation.isLoading}
                    >
                        {createCheckoutSessionMutation.isLoading ? "Processing..." : "Proceed to Payment"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

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