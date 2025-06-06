"use client";

import { useState } from "react";
import type { Artifact, User } from "@prisma/client"; // Assuming User might be part of artifact prop for context
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CrowdfundingProgressBar } from "@/components/ui/crowdfunding-progress-bar"; // Import new component

// Define a more specific type for the artifact prop
interface ArtifactCrowdfundingProps {
  artifact: Pick<
    Artifact,
    | "id"
    | "crowdfundingEnabled"
    | "fundingGoal"
    | "currentFunding"
    // Potentially add other fields if needed for context, e.g., title
  >;
  // user?: User; // If user context is needed for donation logic later
}

export function ArtifactCrowdfundingDetails({ artifact }: ArtifactCrowdfundingProps) {
  const [customAmount, setCustomAmount] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false); // For future tRPC calls

  const handleDonate = async (amount: number) => {
    if (amount <= 0) {
      console.error("Donation amount must be positive.");
      // Potentially show a toast message here
      return;
    }
    console.log(`Attempting to donate ${amount} to artifact ${artifact.id}`);
    setIsLoading(true);

    // TODO: Replace with actual tRPC call in the next step
    // try {
    //   const result = await trpc.donation.create.mutate({ artifactId: artifact.id, amount });
    //   console.log("Donation created (placeholder):", result);
    //   // Redirect to Stripe checkout or handle success
    // } catch (error) {
    //   console.error("Donation failed (placeholder):", error);
    // } finally {
    //   setIsLoading(false);
    // }

    // Simulate API call for now
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log(`Donation of $${amount} for artifact ${artifact.id} processed (simulated).`);
    setIsLoading(false);
    // In a real scenario, you might want to refetch artifact data or update UI
  };

  const handleCustomDonate = () => {
    const amount = parseFloat(customAmount);
    if (!isNaN(amount) && amount > 0) {
      handleDonate(amount);
    } else {
      console.error("Invalid custom amount.");
      // Potentially show a toast
    }
  };

  if (!artifact.crowdfundingEnabled || !artifact.fundingGoal) {
    return null; // Don't render anything if crowdfunding is not enabled or goal not set
  }

  const fundingGoal = Number(artifact.fundingGoal); // Ensure Decimal is number
  const currentFunding = Number(artifact.currentFunding); // Ensure Decimal is number
  const progressPercent = fundingGoal > 0 ? Math.min((currentFunding / fundingGoal) * 100, 100) : 0;

  return (
    <Card className="mt-6 mb-6">
      <CardHeader>
        <CardTitle>Crowdfunding</CardTitle>
        <CardDescription>Support this artifact by making a donation.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between text-sm font-medium mb-1">
            <span>Raised: ${currentFunding.toFixed(2)}</span>
            <span>Goal: ${fundingGoal.toFixed(2)}</span>
          </div>
          <CrowdfundingProgressBar
            currentFunding={currentFunding}
            fundingGoal={fundingGoal}
            showPercentageText={true}
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button onClick={() => handleDonate(1)} disabled={isLoading} className="flex-1">
            Donate $1
          </Button>
          <Button onClick={() => handleDonate(5)} disabled={isLoading} className="flex-1">
            Donate $5
          </Button>
          <Button onClick={() => handleDonate(10)} disabled={isLoading} className="flex-1">
            Donate $10
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 items-center">
          <Input
            type="number"
            placeholder="Custom Amount ($)"
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            min="1"
            step="0.01"
            className="flex-grow"
            disabled={isLoading}
          />
          <Button onClick={handleCustomDonate} disabled={isLoading || !customAmount} className="w-full sm:w-auto">
            Donate Custom Amount
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
