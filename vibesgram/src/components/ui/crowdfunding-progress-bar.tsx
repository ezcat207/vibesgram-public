"use client";

import React from 'react';

interface CrowdfundingProgressBarProps {
  currentFunding: number;
  fundingGoal: number;
  showPercentageText?: boolean; // Optional prop to show text
}

export const CrowdfundingProgressBar: React.FC<CrowdfundingProgressBarProps> = ({
  currentFunding,
  fundingGoal,
  showPercentageText = true, // Default to true
}) => {
  // Avoid division by zero and handle cases where goal is 0 or negative.
  // If fundingGoal is 0 or less, and there's funding, it's effectively >100% of an undefined goal.
  // If fundingGoal is 0 and no funding, it's 0%.
  // Let's define progress as 0% if fundingGoal <= 0, unless currentFunding > 0, then 100% (as goal is met/exceeded).
  let progressPercentage: number;
  if (fundingGoal <= 0) {
    progressPercentage = currentFunding > 0 ? 100 : 0;
  } else {
    progressPercentage = (currentFunding / fundingGoal) * 100;
  }

  // Clamp progress between 0 and 100
  const clampedProgress = Math.min(Math.max(progressPercentage, 0), 100);

  return (
    <div>
      <div className="w-full bg-muted rounded-full h-2.5"> {/* Using theme colors: bg-muted */}
        <div
          className="bg-primary h-2.5 rounded-full transition-all duration-500 ease-out" // Using theme colors: bg-primary
          style={{ width: `${clampedProgress}%` }}
        ></div>
      </div>
      {showPercentageText && (
        <p className="text-xs text-muted-foreground mt-1 text-center"> {/* Using theme colors */}
          {clampedProgress.toFixed(0)}% funded
        </p>
      )}
    </div>
  );
};
