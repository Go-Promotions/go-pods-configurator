import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ModelSelectionSection } from "@/features/configurator/components/model-selection-section";
import { demoCatalogue } from "@/features/configurator/data/demo-catalogue";

describe("ModelSelectionSection", () => {
  it("shows Pioneer as sold out and prevents selection", () => {
    const onSelectModel = vi.fn();

    render(
      <ModelSelectionSection
        models={demoCatalogue.models}
        selectedModelSlug={null}
        onSelectModel={onSelectModel}
      />,
    );

    expect(screen.getAllByText("Sold out")).not.toHaveLength(0);
    const soldOutButton = screen.getByRole("button", { name: /pioneer is sold out/i });
    expect(soldOutButton).toBeDisabled();
    fireEvent.click(soldOutButton);
    expect(onSelectModel).not.toHaveBeenCalled();
  });

  it("keeps available models selectable", () => {
    const onSelectModel = vi.fn();

    render(
      <ModelSelectionSection
        models={demoCatalogue.models}
        selectedModelSlug={null}
        onSelectModel={onSelectModel}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /choose classic/i }));
    expect(onSelectModel).toHaveBeenCalledWith("classic");
  });
});
