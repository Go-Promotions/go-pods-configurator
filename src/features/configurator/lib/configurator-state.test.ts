import { describe, expect, it } from "vitest";

import { demoCatalogue } from "@/features/configurator/data/demo-catalogue";
import {
  configuratorReducer,
  createInitialConfiguratorDraftState,
} from "@/features/configurator/lib/configurator-state";

describe("configurator state", () => {
  it("does not choose a model by default", () => {
    expect(createInitialConfiguratorDraftState().selectedModelSlug).toBeNull();
  });

  it("ignores attempts to restore Pioneer into a new draft", () => {
    const state = createInitialConfiguratorDraftState();

    expect(
      configuratorReducer(state, {
        type: "select-model",
        modelSlug: "pioneer",
        models: demoCatalogue.models,
        options: [],
      }),
    ).toEqual(state);
  });

  it("allows an available model to be selected", () => {
    const state = createInitialConfiguratorDraftState();

    expect(
      configuratorReducer(state, {
        type: "select-model",
        modelSlug: "classic",
        models: demoCatalogue.models,
        options: [],
      }).selectedModelSlug,
    ).toBe("classic");
  });
});
