"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DISCORD_INVITE_URL } from "@/lib/const";
import { User } from "lucide-react";
import { signIn, signOut, useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MobileNav } from "./mobile-nav";

const title = (
  <span>
    Vibes<span className="text-primary">gram</span>
  </span>
);

const baseNavItems = [{ label: "Join Discord", href: DISCORD_INVITE_URL }];
// "Submit Idea" could be a nav item or a standalone button. Let's try standalone first.

export function Header() {
  const { data: session } = useSession();
  const router = useRouter();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <img
            className="rounded-md"
            src="/icon.png"
            alt="Logo"
            width={32}
            height={32}
          />
          <span className="text-lg font-bold">{title}</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center space-x-6 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}

          <Link href="/submit-idea" passHref>
            <Button variant="default" size="sm">Submit Idea</Button>
          </Link>

          {/* Auth UI */}
          {session ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  {session.user.image ? (
                    <Image
                      src={session.user.image}
                      alt={session.user.name ?? "User"}
                      width={32}
                      height={32}
                      className="h-8 w-8 rounded-full"
                    />
                  ) : (
                    <User className="h-5 w-5" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => router.push("/profile")}>
                  My Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/developer")}>
                  Developer Center
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut({ redirectTo: "/" })}>
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" onClick={() => signIn("google")}>
                Sign In
              </Button>
            </>
          )}
        </nav>

        {/* Mobile Navigation */}
        {/* Pass session to MobileNav to conditionally render items like profile/dev center */}
        <MobileNav navItems={baseNavItems} session={session} />
      </div>
    </header>
  );
}
