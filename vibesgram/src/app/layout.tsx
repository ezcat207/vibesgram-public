import "@/styles/globals.css";

import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";
import { SessionProvider } from "next-auth/react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { Toaster } from "@/components/ui/toaster";
import { auth } from "@/server/auth";
import { TRPCReactProvider } from "@/trpc/react";
import GoogleAnalytics from "./GoogleAnalytics";

export const metadata: Metadata = {
  title: "Vibesgram - Share Your Vibe Coding with the World",
  description:
    "Vibesgram is vibe coder's digital gallery. Create, showcase and share your AI-generated web creations instantly with the whole world.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
  openGraph: {
    title: "Vibesgram - Share Your Vibe Coding with the World",
    description:
      "Deploy your vibe code and get a shareable link, free no signup!",
    images: [{ url: "https://vibesgram.com/icon.png" }],
  },
  alternates: {
    canonical: "https://vibesgram.com",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  const pathname = (await headers()).get("x-pathname") ?? "/";

  if (
    session?.user &&
    !session.user.username &&
    !pathname.startsWith("/onboarding")
  ) {
    const returnUrl = encodeURIComponent(pathname);
    redirect(`/onboarding?returnUrl=${returnUrl}`);
  }

  return (
    <html lang="en" className={`${GeistSans.variable}`}>
      <body className="min-h-screen bg-gradient-to-b from-primary/20 to-background">
        <SessionProvider>
          <TRPCReactProvider>{children}</TRPCReactProvider>
        </SessionProvider>
        <GoogleAnalytics id="G-84MKTCPGTV" />
        <Toaster />
      </body>
    </html>
  );
}
