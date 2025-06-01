"use client";

import { useAgentContext } from "@/components/agent/agent-context";
import { Button } from "@/components/ui/button";
import { ToolName } from "@/lib/const";
import { useEffect, useState } from "react";
import { ToolContainer } from "./base/tool-container";
import { ToolTabs } from "./base/tool-tabs";

export function EditorTool() {
  const { editor } = useAgentContext();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Create blob URL for preview when content changes
  useEffect(() => {
    if (editor.hasContent) {
      // Create a blob URL from the HTML content
      const blob = new Blob([editor.content], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);

      // Clean up the URL when component unmounts or content changes
      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [editor.content, editor.hasContent]);

  // Define tabs for the editor
  const tabs = [
    { id: "code", label: "Code" },
    { id: "preview", label: "Preview" },
  ];

  return (
    <ToolContainer
      name={ToolName.CODE_EDITOR}
      title="Editor"
      headerContent={
        <ToolTabs
          tabs={tabs}
          activeTab={editor.activeTab}
          onTabChange={(id) => editor.setActiveTab(id as "code" | "preview")}
        />
      }
    >
      <div className="flex h-[66vh] flex-col bg-white p-2">
        {editor.activeTab === "code" ? (
          editor.hasContent ? (
            // When we have content, display it in a pre tag for code formatting
            <pre className="h-full w-full overflow-auto rounded bg-gray-50 p-4 font-mono text-sm text-gray-800">
              {editor.content}
            </pre>
          ) : (
            // When no content, show a placeholder message
            <div className="flex h-full items-center justify-center">
              <p className="text-base text-muted-foreground">
                No code content available
              </p>
            </div>
          )
        ) : (
          // Preview tab content
          <div className="h-full w-full">
            {editor.hasContent && previewUrl ? (
              <iframe
                src={previewUrl}
                className="h-full w-full border-0"
                title="HTML Preview"
                sandbox="allow-scripts allow-same-origin"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <p className="text-base text-muted-foreground">
                  No content to preview
                </p>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="flex justify-end gap-2 border-t bg-background p-2">
        <Button
          size="sm"
          className="h-8 rounded-md bg-violet-500 px-8 font-medium text-white hover:bg-violet-600"
        >
          Publish
        </Button>
      </div>
    </ToolContainer>
  );
}
