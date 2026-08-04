import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { GuidedQuizFlow } from "@/features/guided-path/components/guided-quiz-flow";
import { guidedQuizFallback } from "@/features/guided-path/data/guided-quiz-fallback";
import {
  buildGuidedTestCatalogue,
  HISTORICAL_PIONEER_ANSWERS,
} from "@/features/guided-path/test/guided-test-fixtures";

vi.mock("@/features/configurator/components/model-spec-dialog", () => ({
  ModelSpecDialog: ({ triggerContent }: { triggerContent?: ReactNode }) => (
    <div>{triggerContent ?? "View standard specification"}</div>
  ),
}));
vi.mock("@/features/configurator/components/option-details-dialog", () => ({
  OptionDetailsDialog: ({
    option,
    triggerContent,
  }: {
    option: { title: string };
    triggerContent?: ReactNode;
  }) => <div>{triggerContent ?? option.title}</div>,
}));
vi.mock("@/features/configurator/components/upsell-suggestions-section", () => ({
  UpsellSuggestionsSection: () => null,
}));

describe("GuidedQuizFlow", () => {
  it("completes a historical Pioneer-oriented path with a tailored Classic setup", () => {
    const catalogue = buildGuidedTestCatalogue();

    render(
      <GuidedQuizFlow
        catalogue={{
          ...catalogue,
          models: [...catalogue.models].reverse(),
        }}
        quiz={guidedQuizFallback}
      />,
    );

    completeQuiz(HISTORICAL_PIONEER_ANSWERS);

    expect(
      screen.getByRole("heading", { name: "Here’s your tailored Classic setup." }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Classic" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Pioneer" })).not.toBeInTheDocument();
    expect(screen.getByText("Space Heater")).toBeInTheDocument();

    const continueLink = screen.getByRole("link", {
      name: "Continue to the configurator with this recommendation",
    });
    expect(continueLink).toHaveAttribute(
      "href",
      expect.stringContaining("model=classic"),
    );
    expect(continueLink).not.toHaveAttribute(
      "href",
      expect.stringContaining("model=pioneer"),
    );
  });

  it("treats a zero-option Classic recommendation as complete", () => {
    render(
      <GuidedQuizFlow
        catalogue={{ ...buildGuidedTestCatalogue(), optionCategories: [] }}
        quiz={guidedQuizFallback}
      />,
    );

    completeQuiz(HISTORICAL_PIONEER_ANSWERS);

    expect(
      screen.getByText(/No optional accessories matched this answer set/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: "Continue to the configurator with this recommendation",
      }),
    ).toBeInTheDocument();
  });

  it("shows a recoverable error instead of trapping the user when Classic is missing", () => {
    const catalogue = buildGuidedTestCatalogue();

    render(
      <GuidedQuizFlow
        catalogue={{
          ...catalogue,
          models: catalogue.models.filter((model) => model.slug !== "classic"),
        }}
        quiz={guidedQuizFallback}
      />,
    );

    completeQuiz(HISTORICAL_PIONEER_ANSWERS);

    expect(
      screen.getByRole("heading", {
        name: "We couldn’t prepare a Classic configuration.",
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start again" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Configure manually" })).toHaveAttribute(
      "href",
      "/configurator",
    );
  });

  it("clears the previous result when the quiz restarts", () => {
    render(
      <GuidedQuizFlow
        catalogue={buildGuidedTestCatalogue()}
        quiz={guidedQuizFallback}
      />,
    );

    completeQuiz(HISTORICAL_PIONEER_ANSWERS);
    fireEvent.click(screen.getByRole("button", { name: "Start again" }));

    expect(screen.getByText("Question 1 of 5")).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Here’s your tailored Classic setup." }),
    ).not.toBeInTheDocument();
  });

  it("recalculates the Classic options after an answer is changed", () => {
    render(
      <GuidedQuizFlow
        catalogue={buildGuidedTestCatalogue()}
        quiz={guidedQuizFallback}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "More than two people regularly" }));
    fireEvent.click(screen.getByRole("button", { name: "Longer stays on campsites" }));
    fireEvent.click(
      screen.getByRole("button", {
        name: "I want the best equipped setup I can get",
      }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "I’ll often be moving it on my own" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    fireEvent.click(
      screen.getByRole("button", {
        name: "I’m happy to keep things simple and do it manually",
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: "A bit of everything" }));

    expect(screen.queryByText("Motor Mover")).not.toBeInTheDocument();
    expect(screen.getByText("Space Heater")).toBeInTheDocument();
  });
});

function completeQuiz(selectedAnswers: Record<string, string>) {
  for (const question of guidedQuizFallback.questions) {
    const answer = question.answers.find(
      (candidate) => candidate.slug === selectedAnswers[question.slug],
    );

    if (!answer) {
      throw new Error(`Missing answer for ${question.slug}`);
    }

    fireEvent.click(screen.getByRole("button", { name: answer.answerText }));
  }
}
