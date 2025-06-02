"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Progress } from "~/components/ui/progress"; // Assuming this exists
import { format } from "date-fns";

// Helper function to format currency (can be moved to a utils file)
const formatCurrency = (amountInCents: number) => {
  return `$${(amountInCents / 100).toFixed(2)}`;
};

// Define a type for the project idea data expected by the card
// This should align with what api.projectIdea.getAll returns in its items
export type ProjectIdeaCardProps = {
  id: string;
  title: string;
  description: string;
  status: string; // ProjectStatus enum as string
  targetPrice: number;
  projectType: string;
  createdAt: Date;
  user?: { // Optional user object
    name?: string | null;
    username?: string | null;
  } | null;
  pledges?: { amount: number }[]; // For calculating total pledged
  // Add other relevant fields like _count for pledges if available for "Hot Projects"
};

export function ProjectIdeaCard({ project }: { project: ProjectIdeaCardProps }) {
  const totalPledged = project.pledges?.reduce((sum, p) => sum + p.amount, 0) || 0;
  const fundingProgress = project.targetPrice > 0 ? (totalPledged / project.targetPrice) * 100 : 0;

  return (
    <Card className="flex flex-col h-full overflow-hidden transition-shadow duration-300 ease-in-out hover:shadow-lg">
      <CardHeader>
        <div className="flex justify-between items-start mb-2">
          <CardTitle className="text-xl font-semibold leading-tight">
            <Link href={`/project/${project.id}`} className="hover:underline">
              {project.title}
            </Link>
          </CardTitle>
          <Badge
            variant={
              project.status === "CROWDFUNDING" ? "default" :
              project.status === "FUNDED" ? "secondary" : // Consider a "success" or "green" variant
              project.status === "COMPLETED" ? "outline" : // Consider a "blue" or "primary" variant for completed
              "secondary" // Default for IN_PROGRESS, CANCELLED
            }
            className="capitalize shrink-0"
          >
            {project.status.toLowerCase().replace("_", " ")}
          </Badge>
        </div>
        <CardDescription className="text-xs text-gray-500">
          By: {project.user?.name || project.user?.username || "Anonymous"} | Type: {project.projectType} <br/>
          Created: {format(new Date(project.createdAt), "MMM d, yyyy")}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-gray-700 line-clamp-3 mb-3">
          {project.description}
        </p>
        {project.status === "CROWDFUNDING" && (
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span>{formatCurrency(totalPledged)} pledged</span>
              <span>Goal: {formatCurrency(project.targetPrice)}</span>
            </div>
            <Progress value={fundingProgress} className="w-full h-2" />
            <p className="text-xs text-right mt-1">{fundingProgress.toFixed(0)}% funded</p>
          </div>
        )}
         {project.status === "FUNDED" && (
          <p className="text-sm font-semibold text-green-600">Successfully Funded!</p>
        )}
        {project.status === "COMPLETED" && (
          <p className="text-sm font-semibold text-blue-600">Project Completed!</p>
        )}
      </CardContent>
      <CardFooter>
        <Link href={`/project/${project.id}`} className="w-full">
          <button className="w-full px-4 py-2 text-sm font-medium text-center text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-blue-800">
            View Details
          </button>
        </Link>
      </CardFooter>
    </Card>
  );
}
