import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/configurator-api", async (original) => ({ ...await original<object>(), configuratorApi: vi.fn() }));
import { configuratorApi, ConfiguratorApiError } from "@/lib/configurator-api";
import { submitConfiguratorEnquiry } from "./submit-configurator-enquiry";
import type { ConfiguratorSubmissionPayload } from "@/types/configurator";
const payload: ConfiguratorSubmissionPayload = {
  selectedModelSlug: "classic", selectedOptionIds: [],
  customerDetails: { name: "Test customer", email: "test@example.com", phone: "07123456789", postcode: "", notes: "", marketingConsent: false, enquiryType: "general_enquiry" },
};
const id = "83cec531-5c4c-46c8-9ef7-67a1b3d4360c";
describe("submission API action", () => {
  beforeEach(() => vi.clearAllMocks());
  it("reuses the supplied UUID across uncertain retries", async () => {
    const success = { status: "success", reference: "GP-TEST", configurationId: "saved-id", emailDelivery: { status: "queued" } };
    vi.mocked(configuratorApi).mockRejectedValueOnce(new Error("timeout")).mockResolvedValue(success);
    expect((await submitConfiguratorEnquiry(payload, id)).status).toBe("error");
    expect(await submitConfiguratorEnquiry(payload, id)).toEqual(success);
    for (const call of vi.mocked(configuratorApi).mock.calls) {
      expect(call[1]?.headers).toEqual({ "Idempotency-Key": id });
      expect(JSON.parse(call[1]?.body as string)).toEqual({ ...payload, submission_id: id });
    }
  });
  it("preserves authoritative unavailable-model and field validation messages", async () => {
    vi.mocked(configuratorApi).mockRejectedValue(new ConfiguratorApiError(422, { selectedModelSlug: ["This Go-Pod model is no longer available."], "customerDetails.email": ["Invalid email"] }));
    expect(await submitConfiguratorEnquiry({ ...payload, selectedModelSlug: "pioneer" }, id)).toEqual({ status: "error", errors: { selectedModelSlug: "This Go-Pod model is no longer available.", email: "Invalid email" } });
  });
  it("rejects invalid input and malformed UUIDs before forwarding", async () => {
    expect((await submitConfiguratorEnquiry({ ...payload, selectedModelSlug: null }, id)).status).toBe("error");
    expect((await submitConfiguratorEnquiry(payload, "not-a-uuid")).status).toBe("error");
    expect(configuratorApi).not.toHaveBeenCalled();
  });
});
