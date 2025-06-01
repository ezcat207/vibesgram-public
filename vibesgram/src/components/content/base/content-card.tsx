import { AspectRatio } from "@/components/ui/aspect-ratio";
import { useLike } from "@/hooks/use-like";
import { getCoverImageUrl } from "@/lib/paths";
import { cn } from "@/lib/utils";
import { type ArtifactItem } from "@/server/api/routers/artifact/schema";
import { ExternalLink, Heart, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

interface ContentCardProps {
  item: ArtifactItem;
  isPreview?: boolean;
  coverImageOverrideUrl?: string;
}

export function ContentCard({ item, isPreview = false, coverImageOverrideUrl }: ContentCardProps) {
  const [imageError, setImageError] = useState(false);
  const { likeCount, isLoading, handleLike } = useLike(item.id, item.likeCount);

  return (
    <div className="group overflow-hidden rounded-md border bg-card shadow-sm transition-all hover:shadow-md">
      <div className="relative w-full overflow-hidden">
        <Link href={isPreview ? "#" : `/a/${item.id}`}>
          <AspectRatio ratio={3 / 4}>
            {/* Image or placeholder */}
            {(coverImageOverrideUrl || item.coverImagePath) && !imageError ? (
              <div className="relative h-full w-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={coverImageOverrideUrl || getCoverImageUrl(item.coverImagePath)}
                  alt={item.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={() => setImageError(true)}
                />
              </div>
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-muted">
                <span className="text-[10px] text-muted-foreground md:text-xs">
                  {item.title.substring(0, 2).toUpperCase()}
                </span>
              </div>
            )}
          </AspectRatio>
        </Link>
      </div>
      <div className="p-1.5 md:p-2">
        <div className="flex items-center justify-between gap-1">
          <h3 className="line-clamp-1 text-xs font-medium md:text-sm">
            {item.title}
          </h3>
          <Link
            href={isPreview ? "#" : `/a/${item.id}`}
            target="_blank"
            className="flex-shrink-0 text-muted-foreground hover:text-foreground"
          >
            <ExternalLink className="h-3 w-3 md:h-3.5 md:w-3.5" />
          </Link>
        </div>
        <div className="mt-0.5 flex items-center justify-between text-[10px] text-muted-foreground md:mt-1 md:text-xs">
          <div className="flex items-center">
            <Link
              href={`/u/${item.user.username}`}
              className="flex items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mr-1 h-4 w-4 overflow-hidden rounded-full bg-muted md:h-5 md:w-5">
                {item.user?.image ? (
                  <Image
                    src={item.user.image}
                    alt={item.user.name ?? ""}
                    width={20}
                    height={20}
                    className="h-full w-full rounded-full"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <User className="h-2.5 w-2.5 md:h-3 md:w-3" />
                  </div>
                )}
              </div>
              <span className="ml-0.5 max-w-[60px] truncate md:ml-1 md:max-w-[80px]">
                {item.user.name}
              </span>
            </Link>
          </div>
          <button
            className="flex items-center gap-1 transition-colors hover:text-foreground disabled:opacity-50"
            onClick={handleLike}
            disabled={isLoading}
          >
            <Heart className={cn("h-3 w-3 md:h-3.5 md:w-3.5", isLoading && "animate-pulse")} />
            <span>{likeCount}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
