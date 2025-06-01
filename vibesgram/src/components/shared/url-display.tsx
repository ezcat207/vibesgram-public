'use client';

import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Copy } from "lucide-react";

interface UrlDisplayProps {
    url: string;
}

export function UrlDisplay({ url }: UrlDisplayProps) {
    const handleCopy = async () => {
        await navigator.clipboard.writeText(url);
        toast({
            title: 'Link copied',
            description: 'The link has been copied to your clipboard',
        });
    };

    return (
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
            >
                {url}
            </a>
            <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={handleCopy}
            >
                <Copy className="h-3.5 w-3.5" />
            </Button>
        </div>
    );
} 