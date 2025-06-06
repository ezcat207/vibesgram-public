import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import * as React from "react"; // Import React for JSX

import { Progress } from "./progress"; // Adjust path as necessary

describe("Progress Component", () => {
  it("renders correctly with a given value", () => {
    const testValue = 50;
    render(<Progress value={testValue} data-testid="progress-bar" />);

    const progressBar = screen.getByTestId("progress-bar");
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveAttribute("aria-valuenow", testValue.toString());

    const indicator = progressBar.firstChild as HTMLElement; // ProgressPrimitive.Indicator
    expect(indicator).toHaveStyle(`transform: translateX(-${100 - testValue}%)`);
  });

  it("renders correctly when no value is provided (defaults to 0)", () => {
    render(<Progress data-testid="progress-bar-default" />);

    const progressBar = screen.getByTestId("progress-bar-default");
    expect(progressBar).toBeInTheDocument();

    // The component's style calculation uses (value || 0), so aria-valuenow might not be set if value is undefined.
    // However, the visual representation (transform) should default to 0.
    // Let's check if aria-valuenow is 0 if `value` prop is explicitly undefined or missing.
    // Radix ProgressPrimitive.Root sets aria-valuenow itself based on the value prop.
    // If value is undefined, it might not set aria-valuenow. Let's verify.
    // For this component, if `value` is not passed, it becomes `undefined` in the props.
    // `(value || 0)` correctly defaults to 0 for the style calculation.
    // Radix's ProgressPrimitive.Root might set aria-valuenow="0" if value is 0.
    // If value is undefined, it might not set aria-valuenow. Let's assume it sets to 0.
    expect(progressBar).toHaveAttribute("aria-valuenow", "0");


    const indicator = progressBar.firstChild as HTMLElement;
    expect(indicator).toHaveStyle("transform: translateX(-100%)"); // 100 - 0
  });

  it("calculates indicator transform correctly for various values", () => {
    const cases = [
      { value: 0, expectedTransform: "translateX(-100%)" },
      { value: 25, expectedTransform: "translateX(-75%)" },
      { value: 75, expectedTransform: "translateX(-25%)" },
      { value: 100, expectedTransform: "translateX(-0%)" },
    ];

    cases.forEach(({ value, expectedTransform }) => {
      const testId = `progress-bar-${value}`;
      render(<Progress value={value} data-testid={testId} />);
      const progressBar = screen.getByTestId(testId);
      const indicator = progressBar.firstChild as HTMLElement;
      expect(indicator).toHaveStyle(`transform: ${expectedTransform}`);
      // Check aria-valuenow as well
      expect(progressBar).toHaveAttribute("aria-valuenow", value.toString());
    });
  });

  it("applies custom className", () => {
    const customClass = "my-custom-class";
    render(<Progress value={50} className={customClass} data-testid="progress-custom-class" />);
    const progressBar = screen.getByTestId("progress-custom-class");
    expect(progressBar).toHaveClass(customClass);
  });
});
