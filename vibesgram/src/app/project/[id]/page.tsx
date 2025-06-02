"use client";

import { useParams } from "next/navigation";
import { api } from "~/trpc/react";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Badge } from "~/components/ui/badge"; // Assuming Badge component exists
import { Progress } from "~/components/ui/progress"; // Assuming Progress component exists
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Checkbox } from "~/components/ui/checkbox"; // Added for milestones
import { useToast } from "~/hooks/use-toast";
import { useSession } from "next-auth/react"; // Added for user session
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns"; // For date formatting

// Helper function to format currency (example)
const formatCurrency = (amountInCents: number) => {
  return `$${(amountInCents / 100).toFixed(2)}`;
};

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { data: session } = useSession(); // Get user session
  const currentUserId = session?.user?.id;
  const id = typeof params.id === "string" ? params.id : "";

  const [pledgeAmount, setPledgeAmount] = useState(1000); // Default to $10.00 (1000 cents)
  const [coverLetter, setCoverLetter] = useState("");

  // Milestone form state
  const [newMilestoneTitle, setNewMilestoneTitle] = useState("");
  const [newMilestoneDescription, setNewMilestoneDescription] = useState("");
  const [newMilestoneDueDate, setNewMilestoneDueDate] = useState("");


  const { data: projectIdea, isLoading, error, refetch: refetchProjectIdea } = api.projectIdea.getById.useQuery(
    { id },
    { enabled: !!id } // Only run query if ID is available
  );

  const createCheckoutSession = api.stripe.createCheckoutSession.useMutation({
    onSuccess: (data) => {
      if (data.checkoutUrl) {
        router.push(data.checkoutUrl);
      } else {
        toast({
          title: "Error",
          description: "Could not initiate Stripe checkout session.",
          variant: "destructive",
        });
      }
    },
    onError: (err) => {
      toast({
        title: "Pledge Error",
        description: err.message || "Failed to create checkout session.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    const paymentStatus = searchParams.get("payment_status");
    const sessionId = searchParams.get("session_id"); // Optional: use if needed for more context

    if (paymentStatus === "success") {
      toast({
        title: "Payment Successful!",
        description: "Your pledge has been recorded. Thank you for your support!",
      });
      refetchProjectIdea(); // Refetch project data to show updated pledge info
      // Clean the URL query params
      router.replace(`/project/${id}`, undefined);
    } else if (paymentStatus === "cancelled") {
      toast({
        title: "Payment Cancelled",
        description: "Your pledge process was cancelled.",
        variant: "default",
      });
      // Clean the URL query params
      router.replace(`/project/${id}`, undefined);
    }
  }, [searchParams, id, router, toast, refetch]);


  const handlePledgeSubmit = async () => {
    if (!projectIdea) return;
    if (pledgeAmount < 50) { // Minimum $0.50 for Stripe
        toast({ title: "Invalid Amount", description: "Pledge amount must be at least $0.50.", variant: "destructive"});
        return;
    }
    createCheckoutSession.mutate({
      projectIdeaId: projectIdea.id,
      amount: pledgeAmount,
    });
  };

  const applyToProjectMutation = api.developerApplication.apply.useMutation({
    onSuccess: () => {
      toast({
        title: "Application Submitted",
        description: "Your application has been successfully submitted.",
      });
      setCoverLetter("");
      // After applying, if the owner views this, they should see the new application.
      // If this user is also the project owner (which is disallowed by backend but for UI consistency),
      // they might want to see their (failed) application, or just refetch project.
      refetchProjectIdea();
      if (projectIdea?.userId === currentUserId) {
        refetchApplicationsForProject();
      }
    },
    onError: (err) => {
      toast({
        title: "Application Error",
        description: err.message || "Failed to submit application.",
        variant: "destructive",
      });
    },
  });

  const handleApplySubmit = () => {
    if (!projectIdea || !coverLetter.trim()) {
      toast({ title: "Missing Information", description: "Please provide a cover letter.", variant: "destructive"});
      return;
    }
    if (coverLetter.trim().length < 50) {
        toast({ title: "Cover Letter Too Short", description: "Cover letter must be at least 50 characters.", variant: "destructive"});
        return;
    }
    applyToProjectMutation.mutate({
      projectIdeaId: projectIdea.id,
      coverLetter: coverLetter.trim(),
    });
  };

  // For Project Owner: Fetching applications for their project
  const { data: applicationsForProject, refetch: refetchApplicationsForProject } = api.developerApplication.getForProject.useQuery(
    { projectIdeaId: id },
    { enabled: !!id && !!currentUserId && projectIdea?.userId === currentUserId && (projectIdea?.status === "FUNDED" || projectIdea?.status === "IN_PROGRESS") }
  );

  // Milestones
  const { data: milestones, refetch: refetchMilestones } = api.projectMilestone.getForProject.useQuery(
    { projectIdeaId: id },
    { enabled: !!id && projectIdea && (projectIdea.status === "IN_PROGRESS" || projectIdea.status === "COMPLETED" || projectIdea.status === "FUNDED") } // Show milestones earlier if needed
  );

  const createMilestoneMutation = api.projectMilestone.create.useMutation({
    onSuccess: () => {
      toast({ title: "Milestone Created", description: "New milestone added to the project." });
      setNewMilestoneTitle("");
      setNewMilestoneDescription("");
      setNewMilestoneDueDate("");
      refetchMilestones();
    },
    onError: (err) => toast({ title: "Milestone Creation Error", description: err.message, variant: "destructive" }),
  });

  const toggleMilestoneMutation = api.projectMilestone.toggleComplete.useMutation({
    onSuccess: (data) => {
      toast({ title: "Milestone Updated", description: `Milestone marked as ${data.completed ? 'complete' : 'incomplete'}.` });
      refetchMilestones();
    },
    onError: (err) => toast({ title: "Milestone Update Error", description: err.message, variant: "destructive" }),
  });

  const deleteMilestoneMutation = api.projectMilestone.delete.useMutation({
    onSuccess: () => {
      toast({ title: "Milestone Deleted", description: "Milestone removed from the project." });
      refetchMilestones();
    },
    onError: (err) => toast({ title: "Milestone Deletion Error", description: err.message, variant: "destructive" }),
  });

  const handleCreateMilestone = () => {
    if (!projectIdea || !newMilestoneTitle.trim()) {
      toast({ title: "Missing Title", description: "Milestone title is required.", variant: "destructive" });
      return;
    }
    createMilestoneMutation.mutate({
      projectIdeaId: projectIdea.id,
      title: newMilestoneTitle.trim(),
      description: newMilestoneDescription.trim(),
      dueDate: newMilestoneDueDate ? new Date(newMilestoneDueDate) : null,
    });
  };

  const acceptedDeveloper = projectIdea?.developerApplications.find(app => app.status === "ACCEPTED");
  const acceptedDeveloperId = acceptedDeveloper?.developerId;
  const isProjectOwner = projectIdea?.userId === currentUserId;
  const isAcceptedDeveloper = acceptedDeveloperId === currentUserId;
  const canManageMilestones = projectIdea?.status === "IN_PROGRESS" && (isProjectOwner || isAcceptedDeveloper);
  const canViewMilestones = projectIdea && (projectIdea.status === "IN_PROGRESS" || projectIdea.status === "COMPLETED" || projectIdea.status === "FUNDED");

  const markProjectCompletedMutation = api.projectIdea.markAsCompleted.useMutation({
    onSuccess: () => {
      toast({ title: "Project Completed!", description: "The project has been marked as completed." });
      refetchProjectIdea();
      refetchMilestones(); // In case status affects milestone display/management
    },
    onError: (err) => toast({ title: "Error Updating Project", description: err.message, variant: "destructive" }),
  });


  const acceptApplicationMutation = api.developerApplication.accept.useMutation({
    onSuccess: (data) => {
      toast({ title: "Application Accepted", description: `Application from ${data.developer?.name || 'developer'} accepted.` });
      refetchProjectIdea(); // To update project status to IN_PROGRESS
      refetchApplicationsForProject(); // To update application statuses
    },
    onError: (err) => {
      toast({ title: "Acceptance Error", description: err.message, variant: "destructive" });
    },
  });

  const rejectApplicationMutation = api.developerApplication.reject.useMutation({
    onSuccess: (data) => {
      toast({ title: "Application Rejected", description: `Application from ${data.developer?.name || 'developer'} rejected.` });
      refetchApplicationsForProject(); // To update application status
    },
    onError: (err) => {
      toast({ title: "Rejection Error", description: err.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-3xl py-12 text-center">
        <p>Loading project details...</p>
        {/* Consider adding a spinner component here */}
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto max-w-3xl py-12">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load project: {error.message}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!projectIdea) {
    return (
      <div className="container mx-auto max-w-3xl py-12 text-center">
        <Alert>
          <AlertTitle>Not Found</AlertTitle>
          <AlertDescription>
            This project idea could not be found.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Calculate total pledged amount (assuming pledges array is available and has 'amount')
  const totalPledged = projectIdea.pledges?.reduce((sum, pledge) => sum + pledge.amount, 0) || 0;
  const fundingProgress = projectIdea.targetPrice > 0 ? (totalPledged / projectIdea.targetPrice) * 100 : 0;

  return (
    <div className="container mx-auto max-w-3xl py-12 space-y-8">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
            <CardTitle className="text-3xl font-bold mb-2 sm:mb-0">{projectIdea.title}</CardTitle>
            <Badge variant={projectIdea.status === 'CROWDFUNDING' ? 'default' : 'secondary'}>
              {projectIdea.status}
            </Badge>
          </div>
          <CardDescription>
            Created by: {projectIdea.user?.name || projectIdea.user?.email || "Anonymous User"} <br />
            Project Type: {projectIdea.projectType}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-2">Project Description</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{projectIdea.description}</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">Funding Goal: {formatCurrency(projectIdea.targetPrice)}</h2>
            <div className="space-y-2">
              <Progress value={fundingProgress} className="w-full" />
              <p className="text-sm text-gray-600">
                {formatCurrency(totalPledged)} pledged ({fundingProgress.toFixed(2)}%)
              </p>
              <p className="text-sm text-gray-600">
                Crowdfunding ends on: {format(new Date(projectIdea.crowdfundingEndDate), "PPP")}
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">Expected Features</h2>
            {projectIdea.expectedFeatures && projectIdea.expectedFeatures.length > 0 ? (
              <ul className="list-disc list-inside space-y-1">
                {projectIdea.expectedFeatures.map((feature, index) => (
                  <li key={index} className="text-gray-700">{feature}</li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-600">No specific features listed.</p>
            )}
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">Contact Information</h2>
            <p className="text-gray-700">{projectIdea.contactInfo}</p>
          </div>

          {/* Placeholder for actions like "Pledge Now" or "Apply to Develop" */}
          <div className="mt-6 pt-6 border-t">
            {projectIdea.status === "CROWDFUNDING" && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Support this Project</h3>
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                  <div className="flex-grow w-full sm:w-auto">
                    <FormLabel htmlFor="pledgeAmount" className="mb-1 block text-sm font-medium">Pledge Amount (in Cents)</FormLabel>
                    <Input
                      id="pledgeAmount"
                      type="number"
                      value={pledgeAmount}
                      onChange={(e) => setPledgeAmount(parseInt(e.target.value, 10))}
                      placeholder="e.g., 1000 for $10.00"
                      min="50" // Stripe minimum
                      className="w-full"
                    />
                  </div>
                  <Button
                    onClick={handlePledgeSubmit}
                    disabled={createCheckoutSession.isPending || projectIdea.userId === projectIdea.user?.id} // Simple check if user is project owner
                    className="w-full sm:w-auto mt-2 sm:mt-0 self-end" // Align button properly
                  >
                    {createCheckoutSession.isPending ? "Processing..." : "Pledge Now"}
                  </Button>
                </div>
                {projectIdea.userId === projectIdea.user?.id && (
                    <p className="text-xs text-muted-foreground mt-1">You cannot pledge to your own project.</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">Minimum pledge is $0.50 (50 cents).</p>
              </div>
            )}
            {projectIdea.status === "FUNDED" && (
              <div className="text-center py-4">
                <h3 className="text-lg font-semibold text-green-600">Project Funded!</h3>
                <p>This project is ready for developers to apply.</p>
              </div>
            )}
            {projectIdea.status === "IN_PROGRESS" && (
              <div className="text-center py-4">
                <h3 className="text-lg font-semibold text-sky-600">Project In Progress!</h3>
                <p>A developer is currently working on this project.</p>
              </div>
            )}
            {projectIdea.status !== "CROWDFUNDING" && projectIdea.status !== "FUNDED" && projectIdea.status !== "IN_PROGRESS" && (
              <div className="text-center py-4">
                <h3 className="text-lg font-semibold">{projectIdea.status}</h3>
                <p>This project is not currently accepting pledges or applications.</p>
              </div>
            )}

            {/* Developer Application Section */}
            {projectIdea.status === "FUNDED" && currentUserId && projectIdea.userId !== currentUserId && (
              <div className="mt-6 pt-6 border-t">
                <h3 className="text-xl font-semibold mb-3">Apply for this Project</h3>
                <div className="space-y-4">
                  <div>
                    <FormLabel htmlFor="coverLetter" className="mb-1 block text-sm font-medium">Your Cover Letter</FormLabel>
                    <Textarea
                      id="coverLetter"
                      value={coverLetter}
                      onChange={(e) => setCoverLetter(e.target.value)}
                      placeholder="Explain why you are a good fit for this project, your relevant skills, and experience..."
                      rows={6}
                      className="w-full"
                      minLength={50}
                      maxLength={5000}
                    />
                    <p className="text-xs text-muted-foreground mt-1">Min 50 characters, Max 5000 characters.</p>
                  </div>
                  <Button
                    onClick={handleApplySubmit}
                    disabled={applyToProjectMutation.isPending || !coverLetter.trim() || coverLetter.trim().length < 50}
                  >
                    {applyToProjectMutation.isPending ? "Submitting Application..." : "Submit Application"}
                  </Button>
                </div>
              </div>
            )}
            {/* Project Owner: Manage Applications Section */}
            {isProjectOwner && (projectIdea.status === "FUNDED" || projectIdea.status === "IN_PROGRESS") && (
              <div className="mt-6 pt-6 border-t">
                <h3 className="text-xl font-semibold mb-4">Developer Applications</h3>
                {applicationsForProject && applicationsForProject.length > 0 ? (
                  <div className="space-y-4">
                    {applicationsForProject.map((app) => (
                      <Card key={app.id}>
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-lg">
                              Applicant: {app.developer.name || app.developer.username || "Unnamed Developer"}
                            </CardTitle>
                            <Badge variant={
                              app.status === "PENDING" ? "outline" :
                              app.status === "ACCEPTED" ? "default" :
                              app.status === "REJECTED" ? "destructive" : "secondary"
                            }>
                              {app.status}
                            </Badge>
                          </div>
                          <CardDescription>Applied on: {format(new Date(app.createdAt), "PPP p")}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap mb-4">{app.coverLetter}</p>
                          {app.status === "PENDING" && projectIdea.status === "FUNDED" && (
                            <div className="flex space-x-2 mt-2">
                              <Button size="sm" onClick={() => acceptApplicationMutation.mutate({ applicationId: app.id })} disabled={acceptApplicationMutation.isPending || rejectApplicationMutation.isPending}>Accept</Button>
                              <Button size="sm" variant="outline" onClick={() => rejectApplicationMutation.mutate({ applicationId: app.id })} disabled={acceptApplicationMutation.isPending || rejectApplicationMutation.isPending}>Reject</Button>
                            </div>
                          )}
                          {app.status === "ACCEPTED" && <p className="text-sm font-semibold text-green-600">This application has been accepted.</p>}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p>No applications received yet for this project.</p>
                )}
              </div>
            )}

            {/* Milestones Section */}
            {canViewMilestones && (
              <div className="mt-6 pt-6 border-t">
                <h3 className="text-xl font-semibold mb-4">Project Milestones</h3>
                {canManageMilestones && (
                  <Card className="mb-6 p-4">
                    <CardHeader><CardTitle className="text-lg">Add New Milestone</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <FormLabel htmlFor="milestoneTitle">Title</FormLabel>
                        <Input id="milestoneTitle" value={newMilestoneTitle} onChange={(e) => setNewMilestoneTitle(e.target.value)} placeholder="Milestone title" />
                      </div>
                      <div>
                        <FormLabel htmlFor="milestoneDesc">Description (Optional)</FormLabel>
                        <Textarea id="milestoneDesc" value={newMilestoneDescription} onChange={(e) => setNewMilestoneDescription(e.target.value)} placeholder="Milestone description" rows={3}/>
                      </div>
                      <div>
                        <FormLabel htmlFor="milestoneDueDate">Due Date (Optional)</FormLabel>
                        <Input id="milestoneDueDate" type="date" value={newMilestoneDueDate} onChange={(e) => setNewMilestoneDueDate(e.target.value)} />
                      </div>
                      <Button onClick={handleCreateMilestone} disabled={createMilestoneMutation.isPending || !newMilestoneTitle.trim()}>
                        {createMilestoneMutation.isPending ? "Adding..." : "Add Milestone"}
                      </Button>
                    </CardContent>
                  </Card>
                )}
                {milestones && milestones.length > 0 ? (
                  <div className="space-y-4">
                    {milestones.map((milestone) => (
                      <Card key={milestone.id} className={`p-4 ${milestone.completed ? 'bg-green-50 opacity-75' : ''}`}>
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className={`font-semibold text-md ${milestone.completed ? 'line-through' : ''}`}>{milestone.title}</h4>
                            {milestone.description && <p className={`text-sm text-gray-600 mt-1 whitespace-pre-wrap ${milestone.completed ? 'line-through' : ''}`}>{milestone.description}</p>}
                            {milestone.dueDate && <p className={`text-xs text-gray-500 mt-1 ${milestone.completed ? 'line-through' : ''}`}>Due: {format(new Date(milestone.dueDate), "PPP")}</p>}
                          </div>
                          {canManageMilestones && (
                            <div className="flex items-center space-x-2 ml-4 flex-shrink-0">
                               <Checkbox
                                id={`milestone-${milestone.id}`}
                                checked={milestone.completed}
                                onCheckedChange={(checked) => {
                                  toggleMilestoneMutation.mutate({
                                    id: milestone.id,
                                    projectIdeaId: projectIdea.id, // Pass projectIdeaId for auth check in backend
                                    completed: !!checked,
                                  });
                                }}
                              />
                              <label htmlFor={`milestone-${milestone.id}`} className="text-sm">Done</label>
                              <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 p-1 h-auto" onClick={() => deleteMilestoneMutation.mutate({ id: milestone.id, projectIdeaId: projectIdea.id })} disabled={deleteMilestoneMutation.isPending}>Delete</Button>
                            </div>
                          )}
                          {!canManageMilestones && milestone.completed && (
                            <Badge variant="default" className="ml-4">Completed</Badge>
                          )}
                           {!canManageMilestones && !milestone.completed && milestone.dueDate && new Date(milestone.dueDate) < new Date() && (
                            <Badge variant="outline" className="ml-4 text-orange-600 border-orange-500">Overdue</Badge>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p>No milestones defined for this project yet.</p>
                )}
              </div>
            )}

            {/* Project Completion Button */}
            {isProjectOwner && projectIdea?.status === "IN_PROGRESS" && (
              <div className="mt-6 pt-6 border-t">
                <h3 className="text-xl font-semibold mb-3">Project Completion</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Once all milestones are met and the project is delivered, you can mark it as completed.
                </p>
                <Button
                  variant="default"
                  onClick={() => markProjectCompletedMutation.mutate({ projectIdeaId: projectIdea.id })}
                  disabled={markProjectCompletedMutation.isPending}
                >
                  {markProjectCompletedMutation.isPending ? "Updating..." : "Mark Project as Completed"}
                </Button>
              </div>
            )}

             <div className="mt-6 pt-4 border-t">
                <h3 className="text-lg font-semibold">Project Communication</h3>
                {/* Basic Placeholder for Communication */}
                {(isProjectOwner || isAcceptedDeveloper) && projectIdea?.status === "IN_PROGRESS" ? (
                   <p className="text-sm text-muted-foreground">
                     Use your preferred communication channels (e.g., email, shared documents) to collaborate. <br/>
                     A dedicated communication log might be added here in the future.
                   </p>
                ) : (
                   <p className="text-sm text-muted-foreground">Communication details will be available once a developer is assigned and work is in progress.</p>
                )}
             </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Minimal FormLabel component if not available or to avoid import complexity if not used elsewhere
// Usually, this would be part of your UI library e.g. ~/components/ui/label
const FormLabel = ({ htmlFor, className, children }: {htmlFor: string, className?: string, children: React.ReactNode}) => (
  <label htmlFor={htmlFor} className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`}>
    {children}
  </label>
);
