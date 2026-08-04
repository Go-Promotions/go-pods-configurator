import { describe, expect, it } from "vitest";

import { demoCatalogue } from "@/features/configurator/data/demo-catalogue";
import {
  getModelSubmissionAvailabilityError,
  getHistoricalModelAvailabilityNotice,
  isModelSelectable,
  sortModelsByAvailability,
} from "@/features/configurator/lib/model-availability";

describe("model availability", () => {
  const classic = demoCatalogue.models.find((model) => model.slug === "classic")!;
  const pioneer = demoCatalogue.models.find((model) => model.slug === "pioneer")!;

  it("keeps available models selectable and Pioneer historical", () => {
    expect(isModelSelectable(classic)).toBe(true);
    expect(isModelSelectable(pioneer)).toBe(false);
  });

  it("prioritises available models ahead of unavailable models", () => {
    expect(sortModelsByAvailability([pioneer, classic])).toEqual([classic, pioneer]);
  });

  it("rejects Pioneer at the final submission boundary", () => {
    expect(
      getModelSubmissionAvailabilityError(pioneer),
    ).toBe("This Go-Pod model is no longer available.");
    expect(
      getModelSubmissionAvailabilityError(classic),
    ).toBeNull();
  });

  it("preserves historical Pioneer configurations with a clear notice", () => {
    expect(getHistoricalModelAvailabilityNotice(pioneer)).toContain(
      "Pioneer is sold out",
    );
    expect(getHistoricalModelAvailabilityNotice(pioneer)).toContain(
      "original selections have not been changed",
    );
    expect(getHistoricalModelAvailabilityNotice(classic)).toBeNull();
  });
});
