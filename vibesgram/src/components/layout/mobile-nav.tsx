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
  session: ReturnType<typeof useSession>['data']; // Accept session as a prop
}

export function MobileNav({ navItems, extraComponents, session }: MobileNavProps) {
  // const { data: session } = useSession(); // Session is now passed as a prop
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

          {/* Submit Idea Button/Link */}
          <Link
            href="/submit-idea"
            className="text-muted-foreground hover:text-foreground text-lg font-medium transition-colors"
          >
            <Button variant="outline" className="w-full justify-start">Submit Idea</Button>
          </Link>

          <hr className="my-2"/>

          {session?.user && (
            <>
              <Link
                href="/profile"
                className="text-muted-foreground hover:text-foreground text-lg font-medium transition-colors"
              >
                My Profile
              </Link>
              <Link
                href="/developer"
                className="text-muted-foreground hover:text-foreground text-lg font-medium transition-colors"
              >
                Developer Center
              </Link>
              <hr className="my-2"/>
            </>
          )}

          {extraComponents}

          {/* Auth Button */}
          {session ? (
            <Button
              variant="ghost"
              onClick={() => signOut({ redirectTo: "/" })}
              className="w-full justify-start text-lg font-medium"
            >
              Sign Out
            </Button>
          ) : (
            <Button
              variant="ghost"
              onClick={() => signIn("google")}
              className="w-full justify-start text-lg font-medium"
            >
              Sign In
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
