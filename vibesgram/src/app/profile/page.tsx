"use client"; // For hooks and client-side logic

import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { api } from "~/trpc/react";
import { useSession } from "next-auth/react";
import { ProjectIdeaList } from "~/components/project/ProjectIdeaList";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { format } from "date-fns";

// Helper function to format currency (can be moved to a utils file)
const formatCurrency = (amountInCents: number) => {
  return `$${(amountInCents / 100).toFixed(2)}`;
};

export default function ProfilePage() {
  const { data: session, status: sessionStatus } = useSession();
  const currentUserId = session?.user?.id;

  // Fetch project ideas published by the current user
  const {
    data: myIdeasData,
    isLoading: isLoadingMyIdeas,
    error: errorMyIdeas
  } = api.projectIdea.getAll.useQuery(
    { userId: currentUserId, limit: 50 }, // Filter by current user's ID
    { enabled: !!currentUserId }
  );

  // Fetch pledges made by the current user
  const {
    data: myPledges,
    isLoading: isLoadingMyPledges,
    error: errorMyPledges
  } = api.pledge.getMine.useQuery(
    undefined,
    { enabled: !!currentUserId }
  );

  if (sessionStatus === "loading" || (sessionStatus === "authenticated" && (isLoadingMyIdeas || isLoadingMyPledges))) {
    return (
      <MainLayout>
        <div className="container mx-auto py-12 text-center">
          <p>Loading your profile...</p>
        </div>
      </MainLayout>
    );
  }

  if (sessionStatus === "unauthenticated") {
    return (
      <MainLayout>
        <div className="container mx-auto py-12">
          <Alert variant="destructive">
            <AlertTitle>Access Denied</AlertTitle>
            <AlertDescription>
              You must be logged in to view your profile.
              <Link href="/api/auth/signin" className="ml-2">
                <Button variant="link">Login</Button>
              </Link>
            </AlertDescription>
          </Alert>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto py-8 px-4 space-y-12">
        <header className="mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
            My Profile
          </h1>
          <p className="mt-3 text-xl text-gray-600 dark:text-gray-300 sm:mt-4">
            View your published ideas and supported projects.
          </p>
          {session?.user && (
            <Card className="mt-6">
              <CardHeader><CardTitle>Account Details</CardTitle></CardHeader>
              <CardContent>
                <p><strong>Name:</strong> {session.user.name || "Not set"}</p>
                <p><strong>Email:</strong> {session.user.email || "Not set"}</p>
                <p><strong>Username:</strong> {session.user.username || "Not set"}</p>
                 {/* Link to edit profile - future feature */}
              </CardContent>
            </Card>
          )}
        </header>

        {/* My Published Ideas */}
        <ProjectIdeaList
          title="My Published Ideas"
          projects={myIdeasData?.items}
          isLoading={isLoadingMyIdeas}
          error={errorMyIdeas?.message}
          emptyStateMessage="You haven't published any project ideas yet."
        />

        {/* My Supported Projects */}
        <section>
          <h2 className="text-3xl font-bold mb-10 text-center">My Supported Projects</h2>
          {isLoadingMyPledges && <p className="text-center">Loading supported projects...</p>}
          {errorMyPledges && <p className="text-center text-red-500">Error: {errorMyPledges.message}</p>}
          {!isLoadingMyPledges && !errorMyPledges && (!myPledges || myPledges.length === 0) && (
            <p className="text-center text-gray-600">You haven't supported any projects yet.</p>
          )}
          {myPledges && myPledges.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {myPledges.map(pledge => (
                <Card key={pledge.id} className="flex flex-col h-full">
                  <CardHeader>
                    <Link href={`/project/${pledge.projectIdea.id}`} className="hover:underline">
                       <CardTitle>{pledge.projectIdea.title}</CardTitle>
                    </Link>
                    <CardDescription>
                        Status: <Badge variant={pledge.projectIdea.status === "CROWDFUNDING" ? "default" : "secondary"} className="capitalize">
                                  {pledge.projectIdea.status.toLowerCase().replace("_", " ")}
                                </Badge>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <p className="text-lg font-semibold text-green-600">You pledged: {formatCurrency(pledge.amount)}</p>
                    <p className="text-sm text-gray-500">On: {format(new Date(pledge.createdAt), "PPP")}</p>
                  </CardContent>
                   <CardFooter>
                      <Link href={`/project/${pledge.projectIdea.id}`} className="w-full">
                        <Button className="w-full">View Project</Button>
                      </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Placeholder for Transaction History */}
        <section>
            <Card>
                <CardHeader>
                    <CardTitle>Transaction History (Coming Soon)</CardTitle>
                    <CardDescription>View your detailed transaction history.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-gray-500">This feature is under development.</p>
                </CardContent>
            </Card>
        </section>

      </div>
    </MainLayout>
  );
}
