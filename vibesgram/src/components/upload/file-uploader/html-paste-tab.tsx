"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/trpc/react";
import { useEffect, useRef, useState } from "react";
import { createPreviewFileFromHtml, wrapHtmlContent } from "./utils";

interface HtmlPasteTabProps {
  onPreviewCreated: (previewId: string) => void;
}

export function HtmlPasteTab({ onPreviewCreated }: HtmlPasteTabProps) {
  const { toast } = useToast();
  const [htmlContent, setHtmlContent] = useState<string>("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Check if HTML contains basic structure
  const isValidHtml = htmlContent.trim().length > 0;

  // API mutation
  const createPreviewMutation = api.artifact.createPreview.useMutation({
    onSuccess: (data) => {
      onPreviewCreated(data.preview.id);

      toast({
        title: "Preview created successfully",
        description: "Redirecting to the preview page",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to create preview",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Create blob URL for the iframe
  useEffect(() => {
    // Create default preview content
    const contentToDisplay = !htmlContent.trim()
      ? "<div style='padding: 20px; text-align: center; color: #666;'>Preview will appear here</div>"
      : wrapHtmlContent(htmlContent);

    // Create a Blob containing the HTML content
    const blob = new Blob([contentToDisplay], { type: "text/html" });

    // Create a URL for the Blob
    const url = URL.createObjectURL(blob);

    // Set the URL as the iframe src
    setPreviewUrl(url);

    // Clean up function to revoke the URL when no longer needed
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [htmlContent]);

  // Handle submit
  const handleSubmit = () => {
    try {
      // Validate pasted HTML
      if (!htmlContent.trim()) {
        toast({
          title: "Please enter HTML content",
          description: "HTML content cannot be empty",
          variant: "destructive",
        });
        return;
      }

      // Process HTML content
      const previewFile = createPreviewFileFromHtml(htmlContent);

      // Call API to create preview
      createPreviewMutation.mutate({ files: [previewFile] });
    } catch (error) {
      toast({
        title: "Error processing HTML content",
        description: `${String(error)}`,
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <div className="mb-4 rounded-md border bg-card p-4">
        <div className="flex items-start space-x-2">
          <div className="text-lg">💡</div>
          <div>
            <p className="font-medium">About HTML Paste</p>
            <p className="text-sm text-muted-foreground">
              You can paste complete HTML documents or just HTML fragments.
              Fragments will be wrapped in a basic HTML document structure
              automatically. The preview updates as you type.
            </p>
          </div>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="flex flex-col">
          <Label htmlFor="html-content">Paste HTML code</Label>
          <Textarea
            id="html-content"
            placeholder="Paste your HTML code here..."
            className="mt-2 min-h-[300px] flex-1 font-mono"
            value={htmlContent}
            onChange={(e) => setHtmlContent(e.target.value)}
          />
        </div>

        <div className="flex flex-col">
          <Label htmlFor="html-preview">Live Preview</Label>
          <div className="mt-2 min-h-[300px] flex-1 rounded-md border border-input bg-background">
            {previewUrl ? (
              <iframe
                ref={iframeRef}
                title="HTML Preview"
                sandbox="allow-scripts"
                className="h-full min-h-[300px] w-full rounded-md"
                src={previewUrl}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                Loading preview...
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <Button
          onClick={handleSubmit}
          disabled={createPreviewMutation.isPending || !isValidHtml}
        >
          {createPreviewMutation.isPending
            ? "Generating Preview..."
            : "Generate Preview URL"}
        </Button>
      </div>
    </>
  );
}
