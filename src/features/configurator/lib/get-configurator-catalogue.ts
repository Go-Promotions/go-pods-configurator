import { demoCatalogue } from "@/features/configurator/data/demo-catalogue";
import { hasPublicSupabaseEnv } from "@/lib/supabase/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
  ConfiguratorCatalogue,
  ConfiguratorOption,
  ConfiguratorModel,
  OptionCategory,
} from "@/types/configurator";
import type { Database } from "@/types/supabase";

export async function getConfiguratorCatalogue(): Promise<ConfiguratorCatalogue> {
  if (!hasPublicSupabaseEnv()) {
    return demoCatalogue;
  }

  try {
    const supabase = createServerSupabaseClient();

    const [
      modelsResult,
      specsResult,
      modelImagesResult,
      categoriesResult,
      optionsResult,
      optionImagesResult,
      compatibilityResult,
      inclusionsResult,
      packageInclusionsResult,
    ] = await Promise.all([
      supabase
        .from("models")
        .select("*")
        .eq("active", true)
        .order("sort_order", { ascending: true }),
      supabase
        .from("model_specs")
        .select("*")
        .order("sort_order", { ascending: true }),
      supabase
        .from("model_images")
        .select("*")
        .order("sort_order", { ascending: true }),
      supabase
        .from("option_categories")
        .select("*")
        .eq("active", true)
        .order("sort_order", { ascending: true }),
      supabase
        .from("options")
        .select("*")
        .eq("active", true)
        .order("sort_order", { ascending: true }),
      supabase
        .from("option_images")
        .select("*")
        .order("sort_order", { ascending: true }),
      supabase.from("option_model_compatibility").select("*"),
      supabase.from("option_model_inclusions").select("*"),
      supabase.from("option_package_inclusions").select("*"),
    ]);

    if (
      modelsResult.error ||
      specsResult.error ||
      modelImagesResult.error ||
      categoriesResult.error ||
      optionsResult.error ||
      optionImagesResult.error ||
      compatibilityResult.error ||
      inclusionsResult.error ||
      packageInclusionsResult.error
    ) {
      return demoCatalogue;
    }

    const modelsRows =
      (modelsResult.data ?? []) as Database["public"]["Tables"]["models"]["Row"][];
    const specsRows =
      (specsResult.data ??
        []) as Database["public"]["Tables"]["model_specs"]["Row"][];
    const modelImageRows =
      (modelImagesResult.data ??
        []) as Database["public"]["Tables"]["model_images"]["Row"][];
    const categoryRows =
      (categoriesResult.data ??
        []) as Database["public"]["Tables"]["option_categories"]["Row"][];
    const optionRows =
      (optionsResult.data ?? []) as Database["public"]["Tables"]["options"]["Row"][];
    const optionImageRows =
      (optionImagesResult.data ??
        []) as Database["public"]["Tables"]["option_images"]["Row"][];
    const compatibilityRows =
      (compatibilityResult.data ??
        []) as Database["public"]["Tables"]["option_model_compatibility"]["Row"][];
    const inclusionRows =
      (inclusionsResult.data ??
        []) as Database["public"]["Tables"]["option_model_inclusions"]["Row"][];
    const packageInclusionRows =
      (packageInclusionsResult.data ??
        []) as Database["public"]["Tables"]["option_package_inclusions"]["Row"][];

    const models: ConfiguratorModel[] = modelsRows.map((model) => ({
      id: model.id,
      slug: model.slug,
      name: model.name,
      shortDescription: model.short_description,
      imagePath: model.image_path,
      images: modelImageRows
        .filter((image) => image.model_id === model.id)
        .map((image) => ({
          id: image.id,
          imagePath: image.image_path,
          altText: image.alt_text,
          sortOrder: image.sort_order,
        })),
      basePrice: Number(model.base_price),
      baseMiro: Number(model.base_miro),
      isActive: model.active,
      availability: model.availability,
      selectable: model.selectable,
      recommendationEligible: model.recommendation_eligible,
      sortOrder: model.sort_order,
      specs: specsRows
        .filter((spec) => spec.model_id === model.id)
        .map((spec) => ({
          id: spec.id,
          sectionLabel: spec.section_label,
          itemLabel: spec.item_label,
          itemValue: spec.item_value,
          iconPath: spec.icon_path,
          sortOrder: spec.sort_order,
        })),
    }));

    const options: ConfiguratorOption[] = optionRows.map((option) => ({
      id: option.id,
      categoryId: option.category_id,
      title: option.title,
      slug: option.slug,
      shortDescription: option.short_description,
      fullDescription: option.full_description,
      primaryImageUrl: option.primary_image_url,
      price: Number(option.price),
      weight: Number(option.weight),
      isActive: option.active,
      sortOrder: option.sort_order,
      scope: option.scope,
      appliesToAllModels: option.applies_to_all_models,
      compatibleModelSlugs: compatibilityRows
        .filter((compatibility) => compatibility.option_id === option.id)
        .map((compatibility) => {
          const model = models.find(
            (candidate) => candidate.id === compatibility.model_id,
          );

          return model?.slug ?? null;
        })
        .filter((slug): slug is string => slug !== null),
      includedModelSlugs: inclusionRows
        .filter((inclusion) => inclusion.option_id === option.id)
        .map((inclusion) => {
          const model = models.find((candidate) => candidate.id === inclusion.model_id);

          return model?.slug ?? null;
        })
        .filter((slug): slug is string => slug !== null),
      includedOptionIds: packageInclusionRows
        .filter((inclusion) => inclusion.package_option_id === option.id)
        .map((inclusion) => inclusion.included_option_id),
      images: optionImageRows
        .filter((image) => image.option_id === option.id)
        .map((image) => ({
          id: image.id,
          imagePath: image.image_path,
          altText: image.alt_text,
          isPrimary: image.is_primary,
          sortOrder: image.sort_order,
        })),
    }));

    const optionCategories: OptionCategory[] = categoryRows.map(
      (category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        sortOrder: category.sort_order,
        isActive: category.active,
        scope: category.scope,
        options: options.filter((option) => option.categoryId === category.id),
      }),
    );

    return {
      source: "supabase",
      models,
      optionCategories,
    };
  } catch {
    // TODO: replace silent fallback with structured observability once the
    // enquiry submission flow and deployment logging are in place.
    return demoCatalogue;
  }
}
