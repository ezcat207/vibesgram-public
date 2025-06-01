"use client";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DISCORD_INVITE_URL } from "@/lib/const";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FileUploadTab } from "./file-upload-tab";
import { HtmlPasteTab } from "./html-paste-tab";

export function FileUploader() {
  const [activeTab, setActiveTab] = useState<"upload" | "paste" | "scratch">("upload");

  const router = useRouter();

  // Handle preview creation completion
  const onPreviewCreated = (previewId: string) => {
    // Navigate to preview page
    router.push(`/upload/preview/${previewId}`);
  };

  return (
    <Tabs
      value={activeTab}
      onValueChange={(v) => setActiveTab(v as "upload" | "paste" | "scratch")}
    >
      <TabsList className="mb-4">
        <TabsTrigger value="upload">Upload Files</TabsTrigger>
        <TabsTrigger value="paste">Paste HTML</TabsTrigger>
        <TabsTrigger value="scratch">Coming Soon</TabsTrigger>
      </TabsList>

      <TabsContent value="upload">
        <FileUploadTab onPreviewCreated={onPreviewCreated} />
      </TabsContent>

      <TabsContent value="paste">
        <HtmlPasteTab onPreviewCreated={onPreviewCreated} />
      </TabsContent>

      <TabsContent value="scratch" className="text-center space-y-6 py-8">
        <div className="space-y-3">
          <h3 className="text-xl font-semibold">Vibesgram Agent!</h3>
          <div className="max-w-[500px] mx-auto">
            <img
              src="/sample/vibesgram-agent.png"
              alt="Vibesgram AI Agent Preview"
              className="w-full h-auto rounded-lg mb-4 shadow-lg"
            />
            <p className="text-muted-foreground">
              We are working on a chat interface, an AI agent to help you do vibe coding and ship your work instantly.
            </p>
          </div>
        </div>

        <Button
          size="lg"
          variant="outline"
          className="gap-2 whitespace-normal h-auto py-2"
          asChild
        >
          <Link
            href={DISCORD_INVITE_URL}
            target="_blank"
            rel="nofollow"
            className="flex items-center"
          >
            <img
              src="/icons/discord-icon.svg"
              alt="Discord"
              width={20}
              height={20}
              className="shrink-0"
            />
            <span>Discuss and shape the future of Vibesgram</span>
          </Link>
        </Button>
      </TabsContent>
    </Tabs>
  );
}
