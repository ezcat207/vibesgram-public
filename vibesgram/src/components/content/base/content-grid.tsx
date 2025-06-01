import { type ArtifactItem } from "@/server/api/routers/artifact/schema";
import { ContentCard } from "./content-card";

interface ContentGridProps {
  items: ArtifactItem[];
}

export function ContentGrid({ items }: ContentGridProps) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {items.map((item) => (
        <ContentCard key={item.id} item={item} />
      ))}
    </div>
  );
}
