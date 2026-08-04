import { beforeEach, describe, expect, it, vi } from "vitest";

import { getSubmissionPdfData } from "@/features/enquiry/lib/get-submission-pdf-data";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role";

vi.mock("@/lib/supabase/service-role", () => ({
  createServiceRoleSupabaseClient: vi.fn(),
}));

describe("getSubmissionPdfData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads a historical Pioneer configuration without replacing its snapshots", async () => {
    const rows = {
      configurations: {
        data: {
          id: "configuration-1",
          public_reference: "GP-HISTORICAL",
          model_id: "model-pioneer",
          status: "submitted",
          created_at: "2026-07-01T10:00:00.000Z",
          base_price_snapshot: 18000,
          options_total_snapshot: 500,
          total_price_snapshot: 18500,
          base_miro_snapshot: 750,
          option_weight_total_snapshot: 12,
          total_miro_snapshot: 762,
        },
        error: null,
      },
      models: {
        data: {
          id: "model-pioneer",
          name: "Pioneer",
          slug: "pioneer",
          active: true,
          availability: "sold_out",
          selectable: false,
        },
        error: null,
      },
      enquiries: {
        data: {
          created_at: "2026-07-01T10:01:00.000Z",
          name: "Historical customer",
          email: "customer@example.com",
          phone: "07123456789",
          postcode: "AB1 2CD",
          notes: "Keep the original specification.",
          enquiry_type: "general_enquiry",
          marketing_consent: false,
        },
        error: null,
      },
      configuration_items: {
        data: [
          {
            category_name_snapshot: "Electrical",
            option_title_snapshot: "Pioneer battery pack",
            option_slug_snapshot: "battery-upgrade-pack",
            price_snapshot: 500,
            weight_snapshot: 12,
            quantity: 1,
            sort_order: 1,
          },
        ],
        error: null,
      },
    };

    const from = vi.fn((table: keyof typeof rows) => {
      const result = rows[table];
      const query = {
        select: () => query,
        eq: () => query,
        order: () =>
          table === "configuration_items" ? Promise.resolve(result) : query,
        limit: () => query,
        single: () => Promise.resolve(result),
      };

      return query;
    });

    vi.mocked(createServiceRoleSupabaseClient).mockReturnValue({ from } as never);

    const result = await getSubmissionPdfData(
      "configuration-1",
      "GP-HISTORICAL",
    );

    expect(result).toMatchObject({
      reference: "GP-HISTORICAL",
      model: {
        name: "Pioneer",
        slug: "pioneer",
        availabilityNotice: expect.stringContaining("Pioneer is sold out"),
      },
      pricing: {
        basePrice: 18000,
        optionsTotal: 500,
        totalPrice: 18500,
      },
      optionsByCategory: [
        {
          categoryName: "Electrical",
          items: [
            expect.objectContaining({
              title: "Pioneer battery pack",
              slug: "battery-upgrade-pack",
            }),
          ],
        },
      ],
    });
  });
});
