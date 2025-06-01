"use client";

import { cn } from "@/lib/utils";

export interface TabItem {
  id: string;
  label: string;
}

interface ToolTabsProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export function ToolTabs({ tabs, activeTab, onTabChange }: ToolTabsProps) {
  return (
    <div className="flex rounded-full bg-muted p-0.5 text-xs">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            "relative rounded-full px-3 py-0.5 text-xs font-medium transition-all duration-200",
            activeTab === tab.id
              ? "bg-background text-primary"
              : "text-muted-foreground hover:text-primary/80",
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
