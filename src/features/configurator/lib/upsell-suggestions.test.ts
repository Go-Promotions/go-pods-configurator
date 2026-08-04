import { describe, expect, it } from "vitest";

import { demoCatalogue } from "@/features/configurator/data/demo-catalogue";
import { getUpsellSuggestions } from "@/features/configurator/lib/upsell-suggestions";

describe("getUpsellSuggestions", () => {
  it("does not expose inactive options in a guided recommendation", () => {
    const option = {
      ...demoCatalogue.optionCategories[0].options[0],
      slug: "motor-mover",
      isActive: false,
    };

    expect(
      getUpsellSuggestions({
        options: [option],
        selectedModel: demoCatalogue.models[0],
        selectedOptionIds: [],
      }),
    ).toEqual([]);
  });
});
