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
  title: "Binbody - Fund Vibe Coding, Amplify Signals, Cut Noise",
  description:
    "Binbody is where vibe coding projects get funded. We champion high signal-to-noise creation, helping you find and support quality ideas while filtering out the rest. Join us to build and back the future of Vibe Coding.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
  openGraph: {
    title: "Binbody - Fund Vibe Coding, Amplify Signals, Cut Noise",
    description:
      "Binbody: Crowdfund innovative vibe coding. Focus on quality, eliminate distractions. Support or launch your project today.",
    images: [{ url: "https://vibesgram.com/icon.png" }],
  },
  alternates: {
    canonical: "https://vibesgram.com",
  },
  other: {
    "msvalidate.01": "EF14BA988A6933B400193F58A798FF2A",
  },
};;

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
        <GoogleAnalytics id="G-RB1K1KDT96" />
        <Toaster />
      </body>
    </html>
  );
}
