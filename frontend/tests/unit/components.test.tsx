import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AssignmentBadge } from "@/components/assignment-badge";
import { TrainPlate } from "@/components/train-plate";

describe("components", () => {
  it("labels assignments in words, not colour alone", () => {
    render(<AssignmentBadge value="IBL" />);
    expect(screen.getByText("Maintenance (IBL)")).toBeInTheDocument();
  });

  it("renders the train plate", () => {
    render(<TrainPlate id="TS-07" />);
    expect(screen.getByText("TS-07")).toBeInTheDocument();
  });
});
