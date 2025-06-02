"use client";

import { api } from "~/trpc/react";
import { useSession } from "next-auth/react";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { format } from "date-fns";

export default function MyApplicationsPage() {
  const { data: session, status: sessionStatus } = useSession();
  const currentUserId = session?.user?.id;

  const {
    data: applications,
    isLoading,
    error,
    refetch // May not be needed here unless there are actions on this page
  } = api.developerApplication.getForDeveloper.useQuery(
    undefined, // No input for this procedure
    { enabled: !!currentUserId } // Only run query if user is logged in
  );

  if (sessionStatus === "loading" || (sessionStatus === "authenticated" && isLoading)) {
    return (
      <div className="container mx-auto max-w-3xl py-12 text-center">
        <p>Loading your applications...</p>
      </div>
    );
  }

  if (sessionStatus === "unauthenticated") {
     return (
      <div className="container mx-auto max-w-3xl py-12">
        <Alert variant="destructive">
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You must be logged in to view your applications.
            <Link href="/api/auth/signin" className="ml-2">
              <Button variant="link">Login</Button>
            </Link>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto max-w-3xl py-12">
        <Alert variant="destructive">
          <AlertTitle>Error Loading Applications</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!applications || applications.length === 0) {
    return (
      <div className="container mx-auto max-w-3xl py-12">
        <Alert>
          <AlertTitle>No Applications Found</AlertTitle>
          <AlertDescription>You have not submitted any developer applications yet.</AlertDescription>
        </Alert>
         <div className="mt-6 text-center">
            <Link href="/#browse-projects"> {/* Assuming home page or a projects listing page */}
                <Button>Browse Projects to Apply</Button>
            </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl py-12 space-y-8">
      <h1 className="text-3xl font-bold mb-8">My Developer Applications</h1>
      <div className="space-y-6">
        {applications.map((app) => (
          <Card key={app.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <Link href={`/project/${app.projectIdea.id}`} legacyBehavior passHref>
                  <a className="hover:underline">
                    <CardTitle className="text-2xl font-semibold">
                      {app.projectIdea.title}
                    </CardTitle>
                  </a>
                </Link>
                <Badge variant={
                  app.status === "PENDING" ? "outline" :
                  app.status === "ACCEPTED" ? "default" : // or success variant
                  app.status === "REJECTED" ? "destructive" : "secondary"
                }>
                  {app.status}
                </Badge>
              </div>
              <CardDescription>
                Applied on: {format(new Date(app.createdAt), "PPP p")} <br/>
                Project Status: {app.projectIdea.status}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <h4 className="font-semibold mb-1">Your Cover Letter:</h4>
              <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded-md">
                {app.coverLetter}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
