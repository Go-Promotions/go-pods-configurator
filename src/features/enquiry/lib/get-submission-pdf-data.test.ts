import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/configurator-api", async (original) => ({ ...await original<object>(), configuratorApi: vi.fn() }));
import { configuratorApi, ConfiguratorApiError } from "@/lib/configurator-api";
import { getSubmissionPdfData } from "./get-submission-pdf-data";
describe("historical PDF lookup", () => {
  beforeEach(() => vi.clearAllMocks());
  it("passes the historical snapshot through without recalculating prices or model availability", async () => {
    const snapshot = { reference: "GP-HISTORICAL", model: { name: "Pioneer", slug: "pioneer", availabilityNotice: "Pioneer is sold out" }, pricing: { basePrice: 18000, optionsTotal: 500, totalPrice: 18500 } };
    vi.mocked(configuratorApi).mockResolvedValue(snapshot);
    expect(await getSubmissionPdfData("configuration-1", "GP-HISTORICAL")).toEqual(snapshot);
    expect(configuratorApi).toHaveBeenCalledWith("configurations/configuration-1?reference=GP-HISTORICAL");
  });
  it("returns null only for a missing or reference-mismatched configuration", async () => {
    vi.mocked(configuratorApi).mockRejectedValue(new ConfiguratorApiError(404));
    expect(await getSubmissionPdfData("id", "bad")).toBeNull();
    vi.mocked(configuratorApi).mockRejectedValue(new ConfiguratorApiError(503));
    await expect(getSubmissionPdfData("id", "ref")).rejects.toThrow();
  });
});
