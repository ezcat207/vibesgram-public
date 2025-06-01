"use client";

import { UrlDisplay } from "@/components/shared/url-display";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PREVIEW_EXPIRATION_HOURS } from "@/lib/const";
import { getPreviewUrl } from "@/lib/paths";
import { signIn, useSession } from "next-auth/react";

interface PreviewDisplayProps {
  previewId: string;
}

export function PreviewDisplay({ previewId }: PreviewDisplayProps) {
  const previewUrl = getPreviewUrl(previewId);
  const { data: session } = useSession();

  return (
    <Card className="mb-8">
      <CardHeader>
        <h2 className="text-xl font-semibold">Preview</h2>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <UrlDisplay url={previewUrl} />
        </div>

        <div className="aspect-video w-full overflow-hidden rounded-md border bg-background">
          <iframe
            src={previewUrl}
            className="h-full w-full"
            title="Content Preview"
          />
        </div>

        <div className="mt-4">
          <p className="text-sm text-muted-foreground">
            Preview expires in {PREVIEW_EXPIRATION_HOURS} hours
            {" "}—{" "}
            {session ? (
              <>
                Publish to make it permanent.
              </>
            ) : (
              <>
                <button
                  onClick={() => signIn("google")}
                  className="font-medium text-primary hover:underline"
                >
                  Sign in
                </button>
                {" "}to save and publish your work to the world!
              </>
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}