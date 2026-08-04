import { describe, expect, it } from "vitest";

import { demoCatalogue } from "@/features/configurator/data/demo-catalogue";
import { getConfiguratorInitialSelections } from "@/features/configurator/lib/get-configurator-initial-selections";

describe("getConfiguratorInitialSelections", () => {
  it("does not hydrate an unavailable model into a new configuration", () => {
    expect(
      getConfiguratorInitialSelections(
        { model: "pioneer", step: "review" },
        demoCatalogue,
      ),
    ).toBeNull();
  });

  it("continues to hydrate an available model", () => {
    expect(
      getConfiguratorInitialSelections({ model: "classic" }, demoCatalogue),
    ).toMatchObject({ selectedModelSlug: "classic", currentStep: "model" });
  });

  it("does not carry a Pioneer-only option into an available model", () => {
    expect(
      getConfiguratorInitialSelections(
        { model: "classic", options: "battery-upgrade-pack" },
        demoCatalogue,
      )?.selectedOptionIds,
    ).toEqual([]);
  });
});
