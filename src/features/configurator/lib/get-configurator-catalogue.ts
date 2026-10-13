import { demoCatalogue } from "@/features/configurator/data/demo-catalogue";
import { getCatalogueRows, isConfiguratorPreview } from "@/lib/configurator-api";
import type {
  ConfiguratorCatalogue,
  ConfiguratorOption,
  ConfiguratorModel,
  OptionCategory,
} from "@/types/configurator";

export async function getConfiguratorCatalogue(): Promise<ConfiguratorCatalogue> {
  if (isConfiguratorPreview()) {
    return demoCatalogue;
  }

  const rows = await getCatalogueRows();
  const ordered = <T extends { sort_order: number }>(items: T[]) => [...items].sort((a, b) => a.sort_order - b.sort_order);
  const modelsRows = ordered(rows.models.filter(row => row.active));
  const specsRows = ordered(rows.model_specs);
  const modelImageRows = ordered(rows.model_images);
  const categoryRows = ordered(rows.option_categories.filter(row => row.active));
  const optionRows = ordered(rows.options.filter(row => row.active));
  const optionImageRows = ordered(rows.option_images);
  const compatibilityRows = rows.option_model_compatibility;
  const inclusionRows = rows.option_model_inclusions;
  const packageInclusionRows = rows.option_package_inclusions;

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
    source: "api",
    models,
    optionCategories,
  };
}
