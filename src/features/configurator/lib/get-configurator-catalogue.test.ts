import { beforeEach, describe, expect, it, vi } from "vitest";

import { getConfiguratorCatalogue } from "@/features/configurator/lib/get-configurator-catalogue";
import { createServerSupabaseClient } from "@/lib/supabase/server";

vi.mock("@/lib/supabase/config", () => ({
  hasPublicSupabaseEnv: () => true,
}));
vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: vi.fn(),
}));

describe("getConfiguratorCatalogue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("maps model availability controls from the live catalogue", async () => {
    const modelRow = {
      id: "model-pioneer",
      slug: "pioneer",
      name: "Pioneer",
      short_description: "Historical Pioneer model",
      image_path: "/images/pioneer.png",
      base_price: 18000,
      base_miro: 750,
      active: true,
      availability: "sold_out",
      selectable: false,
      recommendation_eligible: false,
      sort_order: 2,
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-08-04T00:00:00.000Z",
    } as const;

    const from = vi.fn((table: string) => {
      const result = {
        data: table === "models" ? [modelRow] : [],
        error: null,
      };
      const query = {
        select: () => query,
        eq: () => query,
        order: () => query,
        then: (
          resolve: (value: typeof result) => unknown,
          reject?: (reason: unknown) => unknown,
        ) => Promise.resolve(result).then(resolve, reject),
      };

      return query;
    });

    vi.mocked(createServerSupabaseClient).mockReturnValue({ from } as never);

    await expect(getConfiguratorCatalogue()).resolves.toMatchObject({
      source: "supabase",
      models: [
        {
          slug: "pioneer",
          availability: "sold_out",
          selectable: false,
          recommendationEligible: false,
        },
      ],
    });
  });
});
