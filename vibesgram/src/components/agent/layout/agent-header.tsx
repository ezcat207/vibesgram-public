"use client";

import { ConversationSelector } from "@/components/agent/layout/conversation-selector";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu, Plus, Upload, User } from "lucide-react";
import { signIn, signOut, useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function AgentHeader() {
  const { data: session } = useSession();
  const router = useRouter();

  // Navigate to new conversation
  const navigateToNewConversation = () => {
    router.push("/agent/new");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center px-4">
        {/* Logo (simplified) */}
        <Link href="/" className="mr-2 flex shrink-0 items-center space-x-2">
          <img
            className="rounded-md"
            src="/icon.png"
            alt="Logo"
            width={28}
            height={28}
          />
        </Link>

        {/* Center area - Conversation selector (visible on both desktop and mobile) */}
        <div className="flex flex-1 justify-center px-2 sm:px-4">
          <div className="flex items-center justify-center">
            <div className="inline-block">
              <ConversationSelector />
            </div>
            {/* New conversation button */}
            <Button
              variant="ghost"
              size="icon"
              className="ml-1 flex-shrink-0"
              title="New conversation"
              onClick={navigateToNewConversation}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Desktop - Right buttons and user menu */}
        <div className="ml-2 hidden shrink-0 items-center space-x-2 md:flex">
          {/* Publish Artifact button */}
          <Button variant="outline" size="sm" className="flex items-center">
            <Upload className="mr-1 h-4 w-4" />
            Publish
          </Button>

          {/* User avatar/menu */}
          {session ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full p-0"
                >
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
                <DropdownMenuItem onClick={() => router.push("/dashboard")}>
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut({ redirectTo: "/" })}>
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="ghost" onClick={() => signIn()}>
              Sign In
            </Button>
          )}
        </div>

        {/* Mobile menu */}
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="ml-2 shrink-0 md:hidden"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right">
            <SheetHeader>
              <SheetTitle>Menu</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col space-y-4 pt-8">
              {/* Publish Artifact button (mobile) */}
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  // Publish logic
                }}
              >
                <Upload className="mr-2 h-5 w-5" />
                Publish Artifact
              </Button>

              {/* Navigation links */}
              <Link
                href="/dashboard"
                className="text-lg font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Dashboard
              </Link>

              {/* Sign out button */}
              {session && (
                <Button
                  variant="ghost"
                  onClick={() => signOut({ redirectTo: "/" })}
                  className="w-full justify-start"
                >
                  Sign Out
                </Button>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
