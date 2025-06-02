"use client"; // This page will use hooks for session and data fetching

import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { api } from "~/trpc/react";
import { useSession } from "next-auth/react";
import { ProjectIdeaList } from "~/components/project/ProjectIdeaList"; // Re-use if style is appropriate
import { ProjectIdeaCardProps } from "~/components/project/ProjectIdeaCard"; // Import type
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { format } from "date-fns";

export default function DeveloperPage() {
  const { data: session, status: sessionStatus } = useSession();
  const currentUserId = session?.user?.id;

  // Fetch FUNDED projects - potential projects to apply for
  const {
    data: fundedProjectsData,
    isLoading: isLoadingFunded,
    error: errorFunded
  } = api.projectIdea.getAll.useQuery(
    { limit: 20 /* Add filter for status: "FUNDED" if available, and filter for no accepted developer */ },
    { enabled: !!currentUserId }
  );

  // Fetch applications by the current developer to find their active (accepted) projects
  const {
    data: myApplications,
    isLoading: isLoadingMyApplications,
    error: errorMyApplications
  } = api.developerApplication.getForDeveloper.useQuery(
    undefined,
    { enabled: !!currentUserId }
  );

  if (sessionStatus === "loading" || (sessionStatus === "authenticated" && (isLoadingFunded || isLoadingMyApplications))) {
    return (
      <MainLayout>
        <div className="container mx-auto py-12 text-center">
          <p>Loading developer center...</p>
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
              You must be logged in to access the Developer Center.
              <Link href="/api/auth/signin" className="ml-2">
                <Button variant="link">Login</Button>
              </Link>
            </AlertDescription>
          </Alert>
        </div>
      </MainLayout>
    );
  }

  // Filter for projects available to apply: FUNDED and no accepted applications yet
  // This client-side filter is okay for moderate amounts of data, but backend filtering is better.
  const availableProjects = fundedProjectsData?.items?.filter(
    (p) => p.status === "FUNDED" && (!p.developerApplications || p.developerApplications.every(app => app.status !== "ACCEPTED"))
  ) || [];

  // Filter for active projects where the current user is the accepted developer
  const myActiveProjects: ProjectIdeaCardProps[] = myApplications
    ?.filter(app => app.status === "ACCEPTED" && app.projectIdea.status === "IN_PROGRESS")
    .map(app => ({
        ...app.projectIdea,
        // Ensure all fields for ProjectIdeaCardProps are mapped
        // The `getForDeveloper` query already selects projectIdea title, id, status
        // We might need more fields if ProjectIdeaCard expects them (e.g. description, user, pledges for card display)
        // For now, this will be partial. A dedicated query or extending getForDeveloper might be better.
        title: app.projectIdea.title,
        id: app.projectIdea.id,
        status: app.projectIdea.status,
        description: "Project is in progress. View details for more.", // Placeholder
        targetPrice: 0, // Placeholder
        projectType: "N/A", // Placeholder
        createdAt: new Date(), // Placeholder
        // pledges: [], // Placeholder - not typically shown for active projects
        developerApplications: [], // Placeholder
    })) || [];


  return (
    <MainLayout>
      <div className="container mx-auto py-8 px-4 space-y-12">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
            Developer Center
          </h1>
          <p className="mt-3 text-xl text-gray-600 dark:text-gray-300 sm:mt-4">
            Find projects, manage your applications, and track your work.
          </p>
        </header>

        {/* My Submitted Applications Link/Card */}
        <section>
            <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                    <CardTitle>My Submitted Applications</CardTitle>
                    <CardDescription>View and track the status of all your project applications.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Link href="/developer/applications" passHref>
                        <Button>View My Applications</Button>
                    </Link>
                </CardContent>
            </Card>
        </section>

        {/* Available Projects to Apply For */}
        {/* Using ProjectIdeaList directly might not be ideal if card content needs to be different */}
        <ProjectIdeaList
          title="Available Projects to Apply For"
          projects={availableProjects}
          isLoading={isLoadingFunded}
          error={errorFunded?.message}
          emptyStateMessage="No projects currently available for application. Check back soon!"
        />

        {/* My Active Projects */}
        {myActiveProjects.length > 0 && (
           <ProjectIdeaList
            title="My Active Projects"
            projects={myActiveProjects}
            isLoading={isLoadingMyApplications}
            error={errorMyApplications?.message} // This error is for fetching applications, not projects directly
            emptyStateMessage="You have no active projects." // Should not be shown if list has items
          />
        )}
        {currentUserId && !isLoadingMyApplications && myActiveProjects.length === 0 && (
             <section className="py-8">
                <div className="container mx-auto px-4">
                <h2 className="text-3xl font-bold mb-10 text-center">My Active Projects</h2>
                <p className="text-center text-gray-600">You are not currently assigned to any active projects.</p>
                </div>
            </section>
        )}

        {/* Placeholder for Earnings Statistics */}
        <section>
            <Card>
                <CardHeader>
                    <CardTitle>Earnings Statistics (Coming Soon)</CardTitle>
                    <CardDescription>Track your earnings from completed projects.</CardDescription>
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
