/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { type z } from "zod";

import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
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
import { useToast } from "@/hooks/use-toast";
import { createUsernameSchema } from "@/server/api/routers/user/schema";
import { api } from "@/trpc/react";

type FormData = z.infer<typeof createUsernameSchema>;

export default function OnboardingPage() {
  const router = useRouter();
  const { update: updateSession } = useSession();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl") ?? "/";
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(createUsernameSchema),
    defaultValues: {
      username: "",
    },
  });

  const setUsername = api.user.createUsername.useMutation({
    onSuccess: async (data) => {
      toast({
        title: "Success",
        description: `Your username has been set to ${data.username}`,
      });
      await updateSession();
      router.push(returnUrl);
    },
    onError: (error) => {
      setIsSubmitting(false);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    setIsSubmitting(true);
    setUsername.mutate(data);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="container flex flex-1 flex-col items-center justify-center">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              Choose your username
            </h1>
            <p className="text-muted-foreground text-sm">
              This will be your unique identifier on the platform
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="cooluser"
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                    <FormDescription>
                      Username must be 3-20 characters long and can only contain letters, numbers, - and _.
                    </FormDescription>
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Setting up..." : "Continue"}
              </Button>
            </form>
          </Form>
        </div>
      </main>
    </div>
  );
}
