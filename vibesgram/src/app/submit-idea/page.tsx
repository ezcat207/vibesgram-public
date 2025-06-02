"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { api } from "~/trpc/react";
import { useRouter } from "next/navigation";
import { useToast } from "~/hooks/use-toast"; // Assuming a toast hook exists

// Zod schema for form validation - matches the backend schema
const projectIdeaFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title must be 100 characters or less"),
  description: z.string().min(1, "Description is required").max(5000, "Description must be 5000 characters or less"),
  expectedFeatures: z.string()
    .min(1, "Please list at least one feature.")
    .refine(val => val.split(',').length <= 20, "No more than 20 features allowed.")
    .refine(val => val.split(',').every(f => f.trim().length > 0), "Feature cannot be empty.")
    .refine(val => val.split(',').every(f => f.trim().length <= 100), "Each feature must be 100 characters or less."),
  targetPrice: z.coerce.number().int()
    .min(100, "Target price must be at least $1.00 (100 cents)")
    .max(900, "Target price cannot exceed $9.00 (900 cents)"),
  projectType: z.string().min(1, "Project type is required (e.g., AI Tool, Website)").max(50, "Project type must be 50 characters or less"),
  contactInfo: z.string().min(1, "Contact info is required").email("Invalid email address"),
  crowdfundingEndDate: z.string().refine((val) => {
    try {
      return new Date(val) > new Date();
    } catch (e) {
      return false;
    }
  }, {
    message: "Crowdfunding end date must be a valid date in the future",
  }),
});

type ProjectIdeaFormValues = z.infer<typeof projectIdeaFormSchema>;

export default function SubmitIdeaPage() {
  const router = useRouter();
  const { toast } = useToast(); // Or your preferred toast mechanism
  const form = useForm<ProjectIdeaFormValues>({
    resolver: zodResolver(projectIdeaFormSchema),
    defaultValues: {
      title: "",
      description: "",
      expectedFeatures: "",
      targetPrice: 100, // Default to $1.00
      projectType: "",
      contactInfo: "",
      crowdfundingEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // Default to 30 days from now
    },
  });

  const createProjectIdea = api.projectIdea.create.useMutation({
    onSuccess: (data) => {
      toast({
        title: "Project Idea Submitted!",
        description: `Your idea "${data.title}" has been successfully submitted.`,
      });
      router.push(`/project/${data.id}`); // Navigate to the new project's page
    },
    onError: (error)_ => {
      toast({
        title: "Error Submitting Idea",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    },
  });

  function onSubmit(values: ProjectIdeaFormValues) {
    const featuresArray = values.expectedFeatures.split(",").map(feature => feature.trim()).filter(feature => feature.length > 0);

    createProjectIdea.mutate({
      ...values,
      expectedFeatures: featuresArray,
      crowdfundingEndDate: new Date(values.crowdfundingEndDate),
    });
  }

  return (
    <div className="container mx-auto max-w-2xl py-12">
      <h1 className="mb-8 text-3xl font-bold">Submit Your Project Idea</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Project Title</FormLabel>
                <FormControl>
                  <Input placeholder="My Awesome Project" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Detailed Description</FormLabel>
                <FormControl>
                  <Textarea placeholder="Describe your project in detail..." {...field} rows={5} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="expectedFeatures"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Expected Features</FormLabel>
                <FormControl>
                  <Textarea placeholder="Feature 1, Feature 2, Feature 3..." {...field} />
                </FormControl>
                <FormDescription>
                  List the key features you expect, separated by commas.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="targetPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Target Funding Amount (in Cents)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="e.g., 500 for $5.00" {...field} />
                </FormControl>
                <FormDescription>
                  Enter the amount in cents (e.g., 100 for $1.00, 900 for $9.00). Max $9.00 (900 cents).
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="projectType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Project Type</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., AI Tool, Web App, Mobile Game" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="contactInfo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="your.email@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="crowdfundingEndDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Crowdfunding End Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Placeholder for AI-assisted optimization */}
          <div className="my-6 rounded-md border border-dashed border-yellow-500 bg-yellow-50 p-4">
            <h3 className="text-lg font-semibold text-yellow-700">AI-Assisted Optimization (Coming Soon!)</h3>
            <p className="text-sm text-yellow-600">
              Get help refining your project idea, description, and features using AI.
            </p>
            <Button type="button" variant="outline" size="sm" className="mt-2" disabled>
              Optimize with AI (Placeholder)
            </Button>
          </div>

          <Button type="submit" disabled={createProjectIdea.isPending}>
            {createProjectIdea.isPending ? "Submitting..." : "Submit Project Idea"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
