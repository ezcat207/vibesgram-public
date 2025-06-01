import "@/styles/globals.css";

import { type Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/server/auth";

export const metadata: Metadata = {
  title: "Onboarding Page - Vibesgram, share your vibe coding with the world",
  description: "Vibesgram Onboarding Page",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
  alternates: {
    canonical: "https://vibesgram.com/onboarding"
  },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();

  if (!session) {
    redirect("/api/auth/signin");
  }

  if (session.user?.username) {
    redirect("/");
  }

  return <>{children}</>;
}
