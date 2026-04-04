import { DEFAULT_MTPLM_KG } from "@/features/configurator/lib/vehicle-constants";
import type {
  ConfiguratorModel,
  ConfiguratorOption,
  ConfiguratorSummary,
} from "@/types/configurator";

interface BuildConfiguratorSummaryArgs {
  model: ConfiguratorModel | null;
  selectedOptions: ConfiguratorOption[];
}

export function buildConfiguratorSummary({
  model,
  selectedOptions,
}: BuildConfiguratorSummaryArgs): ConfiguratorSummary {
  const optionsTotal = selectedOptions.reduce(
    (total, option) => total + option.price,
    0,
  );

  const totalOptionWeight = selectedOptions.reduce(
    (total, option) => total + option.weight,
    0,
  );

  return {
    selectedModelName: model?.name ?? null,
    selectedModelSlug: model?.slug ?? null,
    basePrice: model?.basePrice ?? 0,
    selectedOptions: selectedOptions.map((option) => ({
      id: option.id,
      title: option.title,
      scope: option.scope,
      price: option.price,
      weight: option.weight,
    })),
    optionsTotal,
    runningTotal: (model?.basePrice ?? 0) + optionsTotal,
    totalOptionWeight,
    updatedMiro:
      model === null ? null : Number(model.baseMiro + totalOptionWeight),
    remainingPayload:
      model === null
        ? null
        : Number(DEFAULT_MTPLM_KG - (model.baseMiro + totalOptionWeight)),
  };
}
