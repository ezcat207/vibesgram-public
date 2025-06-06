/* eslint-disable @typescript-eslint/no-unsafe-assignment */
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { type z } from "zod";

import { ContentCard } from "@/components/content/base/content-card";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch"; // Added Switch import
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { MAX_COVER_IMAGE_SIZE_KB } from "@/lib/const";
import { getPreviewUrl } from "@/lib/paths";
import { publishFromPreviewSchema } from "@/server/api/routers/artifact/schema";
import { api } from "@/trpc/react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

type FormData = z.infer<typeof publishFromPreviewSchema>;

interface PublishFormProps {
  previewId: string;
}

export function PublishForm({ previewId }: PublishFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { data: session } = useSession();
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [previewImage, setPreviewImage] = useState("/default-cover.png");

  const form = useForm<FormData>({
    resolver: zodResolver(publishFromPreviewSchema),
    defaultValues: {
      previewId,
      title: "",
      description: "",
      coverImage: {
        data: "",
        contentType: "",
      },
      crowdfundingEnabled: false, // Added default value
      fundingGoal: undefined, // Added default value
    },
  });

  // API mutations
  const publishArtifactMutation = api.artifact.publishArtifact.useMutation({
    onSuccess: (data) => {
      toast({
        title: "Published successfully",
        description: `Your artifact has been published with ID: ${data.artifact.id}.`,
        variant: "default",
      });

      router.push(`/a/${data.artifact.id}`);
    },
    onError: (error) => {
      toast({
        title: "Failed to publish",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const screenshotMutation = api.utils.screenshot.useMutation({
    onSuccess: async (result) => {
      try {
        const imageUrl = `data:image/png;base64,${result.base64Image}`;
        setPreviewImage(imageUrl);

        form.setValue("coverImage", {
          data: result.base64Image,
          contentType: "image/png",
        });

        toast({
          title: "Screenshot taken",
          description: "Screenshot has been set as cover image",
          variant: "default",
        });
      } catch (error) {
        console.error('Screenshot processing error:', error);
        toast({
          title: "Screenshot processing failed",
          description: "Failed to process the screenshot",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Screenshot failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle cover image upload
  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];

      // Check file size (convert KB to bytes)
      if (file.size > MAX_COVER_IMAGE_SIZE_KB * 1024) {
        toast({
          title: "File too large",
          description: `Cover image must be less than ${MAX_COVER_IMAGE_SIZE_KB}KB`,
          variant: "destructive",
        });
        return;
      }

      try {
        const buffer = await file.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        const imageUrl = `data:${file.type};base64,${base64}`;
        setPreviewImage(imageUrl);

        form.setValue("coverImage", {
          data: base64,
          contentType: file.type,
        });
      } catch (error) {
        console.error("Image processing error:", error);
        toast({
          title: "Failed to process image",
          description: "Error processing the image file",
          variant: "destructive",
        });
      }
    }
  };

  // Handle form submission
  const onSubmit = async (data: FormData) => {
    if (!session) {
      await signIn("google");
      return;
    }
    // Ensure fundingGoal is undefined if crowdfunding is not enabled
    // The Zod schema on the backend also handles this, but good for client consistency
    const submissionData = {
      ...data,
      fundingGoal: data.crowdfundingEnabled ? data.fundingGoal : undefined,
    };
    publishArtifactMutation.mutate(submissionData);
  };

  const watchCrowdfundingEnabled = form.watch("crowdfundingEnabled");

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-semibold">
          Complete Information and Publish
        </h2>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-6"> {/* Increased space-y for new fields */}
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title <span className="text-xs text-muted-foreground">(required)</span></FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Add a title to your artifact"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div>
                  <FormLabel htmlFor="cover-image">Cover Image <span className="text-xs text-muted-foreground">(required)</span></FormLabel>
                  <div className="mt-2 flex flex-col sm:flex-row items-center gap-4">
                    <Input
                      id="cover-image"
                      type="file"
                      ref={coverInputRef}
                      onChange={handleCoverChange}
                      accept="image/*"
                      className="hidden"
                    />
                    <Button
                      type="button"
                      disabled={screenshotMutation.isPending}
                      onClick={async () => {
                        if (!session) {
                          await signIn("google");
                          return;
                        }

                        const url = getPreviewUrl(previewId);
                        screenshotMutation.mutate({ url });
                      }}
                    >
                      {screenshotMutation.isPending ? "Taking Screenshot (about 5s)..." : "Take Screenshot (600x800)"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => coverInputRef.current?.click()}
                    >
                      Upload Cover Image
                    </Button>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Maximum file size: {MAX_COVER_IMAGE_SIZE_KB}KB
                  </p>
                  <FormMessage>{form.formState.errors.coverImage?.message}</FormMessage>
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormDescription>
                        Add a description to help people find your work from search engines like google.
                      </FormDescription>
                      <FormControl>
                        <Textarea
                          placeholder="The story behind the artifact, the prompt you used to generate it, etc..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Crowdfunding Fields Start */}
                <FormField
                  control={form.control}
                  name="crowdfundingEnabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Enable Crowdfunding
                        </FormLabel>
                        <FormDescription>
                          Allow others to fund this artifact.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {watchCrowdfundingEnabled && (
                  <FormField
                    control={form.control}
                    name="fundingGoal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Funding Goal ($)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="e.g., 100"
                            min="1"
                            step="0.01" // Allow cents
                            {...field}
                            // Ensure value is number or undefined for the Zod schema
                            onChange={(e) => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormDescription>
                          The target amount you want to raise.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                {/* Crowdfunding Fields End */}

              </div>

              <div className="space-y-4">
                <div>
                  <FormLabel>Preview Card</FormLabel>
                  <div className="mt-2 flex justify-center">
                    <div className="w-[180px] relative">
                      <ContentCard
                        item={{
                          id: "preview",
                          title: form.watch("title") || "Untitled Artifact",
                          likeCount: 42,
                          coverImagePath: "",
                          userId: session?.user?.id ?? "",
                          description: form.watch("description"),
                          user: {
                            id: session?.user?.id ?? "",
                            name: session?.user?.name ?? "Vibe Coder",
                            image: session?.user?.image ?? "",
                            username: session?.user?.username ?? "",
                          },
                          createdAt: new Date(),
                          updatedAt: new Date(),
                          deletedAt: null,
                          fileSize: 0,
                          fileCount: 0,
                          conversationId: null,
                          // For preview card, crowdfunding details might not be directly shown
                          // or could be shown based on watched form values.
                          // For simplicity, not adding them to card preview here.
                        }}
                        isPreview
                        coverImageOverrideUrl={previewImage}
                      />
                      <div className="absolute inset-0" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button
              type="submit"
              disabled={!session || publishArtifactMutation.isPending}
              className="px-8"
            >
              {!session
                ? "Sign in to publish"
                : publishArtifactMutation.isPending
                  ? "Publishing..."
                  : "Publish"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
