"use client";

import { DISCORD_INVITE_URL } from "@/lib/const";
import { Footer } from "./footer";
import { Header } from "./header";

interface MainLayoutProps {
  children: React.ReactNode;
  showFooter?: boolean;
  footerProps?: {
    disclaimer?: {
      poweredBy?: string;
      note?: string;
    };
  };
}

const defaultFooterContent = {
  title: "Vibesgram",
  description: "Vibesgram is a vibe coding digital gallery.",
  contact: {
    email: "contact@vibesgram.com",
  },
  sections: [
    {
      title: "Product",
      links: [
        { label: "Privacy Policy", href: "/privacy-policy" },
        { label: "Terms of Service", href: "/tos" },
        { label: "Contact Us", href: "mailto:contact@vibesgram.com" },
        { label: "Pricing", href: "/#" },
      ],
    },
    {
      title: "Resources",
      links: [
        { label: "Documentation", href: "/#" },
        { label: "Help Center", href: "/#" },
        { label: "Blog", href: "/#" },
        { label: "API", href: "/#" },
      ],
    },
  ],
  socialLinks: [{ platform: "Discord", href: DISCORD_INVITE_URL }],
};

export function MainLayout({ children, showFooter = true }: MainLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="container mx-auto flex-1 px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
      {showFooter && <Footer {...defaultFooterContent} />}
    </div>
  );
}
