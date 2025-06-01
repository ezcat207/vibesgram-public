// Panel Content Component
"use client";

import { ToolList } from "./tool-list";

export function PanelContent() {
  return (
    // we handle scroll here, cause if it's mixed with the dnd-kit,
    // it would cause hydration error.
    <div className="relative h-full w-full flex-1 overflow-hidden">
      <div className="scrollbar-thumb-rounded-full absolute inset-0 overflow-y-auto overscroll-none p-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-400/50 hover:scrollbar-thumb-gray-400/70">
        <ToolList />
      </div>
    </div>
  );
}
