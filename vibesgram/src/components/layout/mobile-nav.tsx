"use client";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { signIn, signOut, useSession } from "next-auth/react";
import Link from "next/link";

interface MobileNavProps {
  navItems: {
    label: string;
    href: string;
    newWindow?: boolean;
  }[];
  extraComponents?: React.ReactNode;
}

export function MobileNav({ navItems, extraComponents }: MobileNavProps) {
  const { data: session } = useSession();
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Navigation</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col space-y-4 pt-8">
          {/* Navigation Links */}
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-muted-foreground hover:text-foreground text-lg font-medium transition-colors"
              {...(item.newWindow
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
            >
              {item.label}
            </Link>
          ))}

          {session?.user?.username && (
            <Link
              key="profile"
              href={"/u/" + session?.user?.username}
              className="text-muted-foreground hover:text-foreground text-lg font-medium transition-colors"
            >
              Profile
            </Link>
          )}

          {extraComponents}

          {/* Auth Button */}
          {session ? (
            <Button
              variant="ghost"
              onClick={() => signOut()}
              className="w-full justify-start"
            >
              Sign Out
            </Button>
          ) : (
            <Button
              variant="ghost"
              onClick={() => signIn("google")}
              className="w-full justify-start"
            >
              Sign In
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
