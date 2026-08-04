import { beforeEach, describe, expect, it, vi } from "vitest";

import { demoCatalogue } from "@/features/configurator/data/demo-catalogue";
import { getConfiguratorCatalogue } from "@/features/configurator/lib/get-configurator-catalogue";
import { submitConfiguratorEnquiry } from "@/features/enquiry/actions/submit-configurator-enquiry";
import { sendSubmissionEmails } from "@/features/enquiry/lib/send-submission-emails";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role";
import type { ConfiguratorSubmissionPayload } from "@/types/configurator";

vi.mock("@/features/configurator/lib/get-configurator-catalogue", () => ({
  getConfiguratorCatalogue: vi.fn(),
}));
vi.mock("@/features/enquiry/lib/send-submission-emails", () => ({
  sendSubmissionEmails: vi.fn(),
}));
vi.mock("@/lib/supabase/config", () => ({
  hasPublicSupabaseEnv: () => true,
}));
vi.mock("@/lib/supabase/service-role", () => ({
  createServiceRoleSupabaseClient: vi.fn(),
}));

const validPayload: ConfiguratorSubmissionPayload = {
  selectedModelSlug: "classic",
  selectedOptionIds: [],
  customerDetails: {
    name: "Taylor Palmer",
    email: "taylor@example.com",
    phone: "07123456789",
    postcode: "AB1 2CD",
    notes: "",
    marketingConsent: false,
    enquiryType: "general_enquiry",
  },
};

describe("submitConfiguratorEnquiry model availability", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getConfiguratorCatalogue).mockResolvedValue({
      ...demoCatalogue,
      source: "supabase",
    });
  });

  it("rejects a manually submitted Pioneer payload before persistence", async () => {
    const result = await submitConfiguratorEnquiry({
      ...validPayload,
      selectedModelSlug: "pioneer",
    });

    expect(result).toEqual({
      status: "error",
      errors: {
        selectedModelSlug: "This Go-Pod model is no longer available.",
      },
    });
    expect(createServiceRoleSupabaseClient).not.toHaveBeenCalled();
  });

  it("allows an available-model payload to reach successful persistence", async () => {
    const from = vi.fn((table: string) => {
      if (table === "configurations") {
        return {
          insert: () => ({
            select: () => ({
              single: async () => ({
                data: { id: "configuration-1", public_reference: "GP-TEST" },
                error: null,
              }),
            }),
          }),
        };
      }

      if (table === "enquiries") {
        return {
          insert: async () => ({ error: null }),
        };
      }

      throw new Error(`Unexpected table ${table}`);
    });

    vi.mocked(createServiceRoleSupabaseClient).mockReturnValue({
      from,
    } as never);
    vi.mocked(sendSubmissionEmails).mockResolvedValue({ status: "sent" });

    await expect(submitConfiguratorEnquiry(validPayload)).resolves.toMatchObject({
      status: "success",
      configurationId: "configuration-1",
      reference: "GP-TEST",
    });
  });

  it("reports a model retired concurrently by the database guard", async () => {
    const from = vi.fn((table: string) => {
      if (table !== "configurations") {
        throw new Error(`Unexpected table ${table}`);
      }

      return {
        insert: () => ({
          select: () => ({
            single: async () => ({
              data: null,
              error: {
                message: "This Go-Pod model is no longer available.",
              },
            }),
          }),
        }),
      };
    });

    vi.mocked(createServiceRoleSupabaseClient).mockReturnValue({
      from,
    } as never);

    await expect(submitConfiguratorEnquiry(validPayload)).resolves.toEqual({
      status: "error",
      errors: {
        selectedModelSlug: "This Go-Pod model is no longer available.",
      },
    });
  });
});
