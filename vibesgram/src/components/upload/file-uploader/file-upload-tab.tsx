"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { MAX_ARTIFACT_FILE_TOTAL_SIZE, MAX_USER_ARTIFACTS } from "@/lib/const";
// Removed tRPC dependency - using V1 API directly for better performance
import { FileIcon, InfoIcon, UploadIcon, XIcon } from "lucide-react";
import { useRef, useState } from "react";
import { createPreviewFilesFromUpload, type PreviewFile } from "./utils";

interface FileUploadTabProps {
  onPreviewCreated: (previewId: string) => void;
}

export function FileUploadTab({ onPreviewCreated }: FileUploadTabProps) {
  const { toast } = useToast();

  // File input references
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  // Internal state
  const [previewFiles, setPreviewFiles] = useState<PreviewFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // Validation checks
  const hasIndexHtml = previewFiles.some((file) => file.path === "index.html");
  const totalSize = previewFiles.reduce((sum, file) => sum + atob(file.content).length, 0);
  const isFileSizeValid = totalSize <= MAX_ARTIFACT_FILE_TOTAL_SIZE;
  const isFileCountValid = previewFiles.length <= MAX_USER_ARTIFACTS;

  // Handle drag and drop
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const items = Array.from(e.dataTransfer.items);
    const allFiles: File[] = [];

    // Helper function to recursively read directory
    const readDirectory = async (entry: FileSystemDirectoryEntry): Promise<void> => {
      const reader = entry.createReader();
      const entries = await new Promise<FileSystemEntry[]>((resolve) => {
        reader.readEntries(resolve);
      });

      for (const entry of entries) {
        if (entry.isFile) {
          const file: File = await new Promise((resolve) => {
            (entry as FileSystemFileEntry).file(resolve);
          });
          // Keep original path from entry
          Object.defineProperty(file, 'webkitRelativePath', {
            value: entry.fullPath
          });
          allFiles.push(file);
        } else if (entry.isDirectory) {
          await readDirectory(entry as FileSystemDirectoryEntry);
        }
      }
    };

    // Process all dropped items
    for (const item of items) {
      if (item.kind === 'file') {
        const entry = item.webkitGetAsEntry();
        if (!entry) continue;

        if (entry.isFile) {
          const file = item.getAsFile();
          if (file) {
            // For files dropped directly, use their original path
            Object.defineProperty(file, 'webkitRelativePath', {
              value: entry.fullPath
            });
            allFiles.push(file);
          }
        } else if (entry.isDirectory) {
          await readDirectory(entry as FileSystemDirectoryEntry);
        }
      }
    }

    if (allFiles.length > 0) {
      const newPreviewFiles = await createPreviewFilesFromUpload(allFiles);
      setPreviewFiles(newPreviewFiles);
    }
  };

  // V1 API state
  const [isCreatingPreview, setIsCreatingPreview] = useState(false);

  // V1 API function for file upload
  const createPreviewWithV1 = async (files: PreviewFile[]) => {
    setIsCreatingPreview(true);
    try {
      const response = await fetch('/api/v1/preview/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ files }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json() as { success: boolean; data: { previewId: string } };
      onPreviewCreated(data.data.previewId);

      toast({
        title: "Preview created successfully",
        description: "Redirecting to the preview page",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Failed to create preview",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsCreatingPreview(false);
    }
  };

  // Handle file upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newPreviewFiles = await createPreviewFilesFromUpload(Array.from(e.target.files));
      setPreviewFiles(newPreviewFiles);
    }
  };

  // Handle folder upload
  const handleFolderChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newPreviewFiles = await createPreviewFilesFromUpload(Array.from(e.target.files));
      setPreviewFiles(newPreviewFiles);
    }
  };

  // Clear selected files
  const handleClearFiles = () => {
    setPreviewFiles([]);
    // Reset the file inputs
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (folderInputRef.current) {
      folderInputRef.current.value = "";
    }
  };

  // Handle submit
  const handleSubmit = async () => {
    try {
      // Validate file upload
      if (previewFiles.length === 0) {
        toast({
          title: "Please select files",
          description: "You need to upload at least one file",
          variant: "destructive",
        });
        return;
      }

      if (!hasIndexHtml) {
        toast({
          title: "Missing index.html",
          description: "Your upload must include an index.html file",
          variant: "destructive",
        });
        return;
      }

      if (!isFileSizeValid) {
        toast({
          title: "Files too large",
          description: `Total file size must not exceed ${MAX_ARTIFACT_FILE_TOTAL_SIZE / (1024 * 1024)}MB`,
          variant: "destructive",
        });
        return;
      }

      if (!isFileCountValid) {
        toast({
          title: "Too many files",
          description: `You can upload up to ${MAX_USER_ARTIFACTS} files`,
          variant: "destructive",
        });
        return;
      }

      // Call V1 API to create preview
      await createPreviewWithV1(previewFiles);
    } catch {
      toast({
        title: "Failed to create preview",
        description: "Error processing files",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <div className="mb-4 rounded-md border bg-card p-4">
        <div className="flex items-start space-x-2">
          <div className="text-lg">📋</div>
          <div>
            <p className="font-medium">About File Upload</p>
            <p className="text-sm text-muted-foreground">
              Your upload must include an{" "}
              <code className="rounded bg-muted px-1 py-0.5 font-mono text-sm">
                index.html
              </code>{" "}
              file, which will be used as the entry point.
            </p>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <Label className="mb-2 block">Select files to upload</Label>

        {previewFiles.length === 0 ? (
          <div
            className={`flex h-40 flex-col items-center justify-center rounded-md border border-dashed ${isDragging ? "border-primary bg-primary/5" : "border-primary/50"
              } bg-background p-8 text-center transition-colors`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <UploadIcon className="mb-2 h-10 w-10 text-muted-foreground" />
            <p className="mb-1 text-sm font-medium">
              Drag files or folder here, or choose an upload method
            </p>
            <p className="mb-4 text-xs text-muted-foreground">
              Supports HTML, CSS, JS, images and other web assets
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                Select Files
              </Button>
              <Button
                variant="outline"
                onClick={() => folderInputRef.current?.click()}
              >
                Select Folder
              </Button>
            </div>
            <input
              id="file-upload"
              type="file"
              multiple
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
            <input
              id="folder-upload"
              type="file"
              {...{
                webkitdirectory: "",
                directory: ""
              }}
              ref={folderInputRef}
              onChange={handleFolderChange}
              className="hidden"
            />
          </div>
        ) : (
          <div className="rounded-md border border-border bg-background p-4">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <p className="font-medium">Selected {previewFiles.length} file(s)</p>
                <p className="text-xs text-muted-foreground">
                  Total size: {(totalSize / (1024 * 1024)).toFixed(2)}MB
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearFiles}
                className="text-xs"
              >
                <XIcon className="mr-1 h-3 w-3" />
                Clear All
              </Button>
            </div>

            <div className="max-h-40 overflow-y-auto rounded-md bg-muted/30 p-3">
              <ul className="space-y-1">
                {previewFiles.map((file, index) => (
                  <li
                    key={index}
                    className={`flex items-center rounded-sm px-2 py-1 text-sm ${file.path === "index.html"
                      ? "bg-primary/10 font-medium text-primary"
                      : "hover:bg-muted/50"
                      }`}
                  >
                    <FileIcon className="mr-2 h-4 w-4" />
                    {file.path}
                    <span className="ml-auto text-xs text-muted-foreground">
                      {(atob(file.content).length / 1024).toFixed(1)} KB
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-3 space-y-2">
              {!hasIndexHtml && (
                <Alert variant="destructive">
                  <InfoIcon className="h-4 w-4" />
                  <AlertTitle>Missing Required File</AlertTitle>
                  <AlertDescription>
                    No index.html file detected. This file is required for your upload.
                  </AlertDescription>
                </Alert>
              )}
              {!isFileSizeValid && (
                <Alert variant="destructive">
                  <InfoIcon className="h-4 w-4" />
                  <AlertTitle>Files Too Large</AlertTitle>
                  <AlertDescription>
                    Total file size must not exceed {MAX_ARTIFACT_FILE_TOTAL_SIZE / (1024 * 1024)}MB.
                  </AlertDescription>
                </Alert>
              )}
              {!isFileCountValid && (
                <Alert variant="destructive">
                  <InfoIcon className="h-4 w-4" />
                  <AlertTitle>Too Many Files</AlertTitle>
                  <AlertDescription>
                    You can upload up to {MAX_USER_ARTIFACTS} files.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-end">
        <Button
          onClick={handleSubmit}
          disabled={
            isCreatingPreview ||
            previewFiles.length === 0 ||
            !hasIndexHtml ||
            !isFileSizeValid ||
            !isFileCountValid
          }
        >
          {isCreatingPreview
            ? "Generating Preview..."
            : "Generate Preview URL"}
        </Button>
      </div>
    </>
  );
}
