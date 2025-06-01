"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ToolName } from "@/lib/const";
import { ToolContainer } from "./base/tool-container";

export function PublishTool() {
  // Adding a simple header indicator for consistency
  const publishHeader = <Badge>Publishing</Badge>;

  return (
    <ToolContainer
      name={ToolName.PUBLISH}
      title="Publish"
      headerContent={publishHeader}
    >
      <div className="space-y-4 p-4">
        <div className="space-y-1">
          <label className="text-xs font-medium">Title:</label>
          <input
            type="text"
            className="w-full rounded-md border p-1.5 text-sm shadow-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium">Description:</label>
          <input
            type="text"
            className="w-full rounded-md border p-1.5 text-sm shadow-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium">Tags:</label>
          <input
            type="text"
            className="w-full rounded-md border p-1.5 text-sm shadow-sm"
          />
        </div>
        <div className="flex justify-end space-x-2 pt-2">
          <Button variant="outline" size="sm" className="h-7 px-3 text-xs">
            Generate TDK
          </Button>
          <Button
            size="sm"
            className="h-7 bg-violet-500 px-3 text-xs text-white hover:bg-violet-600"
          >
            Publish
          </Button>
        </div>
      </div>
    </ToolContainer>
  );
}
