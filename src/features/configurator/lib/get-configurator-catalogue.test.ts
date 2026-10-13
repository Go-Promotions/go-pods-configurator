import { beforeEach, describe, expect, it, vi } from "vitest";

import { getConfiguratorCatalogue } from "@/features/configurator/lib/get-configurator-catalogue";
import { getCatalogueRows } from "@/lib/configurator-api";
vi.mock("@/lib/configurator-api", () => ({ isConfiguratorPreview: () => false, getCatalogueRows: vi.fn() }));

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

    vi.mocked(getCatalogueRows).mockResolvedValue({
      models: [modelRow], model_specs: [], model_images: [], option_categories: [], options: [], option_images: [], option_model_compatibility: [], option_model_inclusions: [], option_package_inclusions: [],
    } as never);

    await expect(getConfiguratorCatalogue()).resolves.toMatchObject({
      source: "api",
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
