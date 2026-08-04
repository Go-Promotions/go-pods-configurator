import {
  getOptionAvailabilityState,
  isPackageOption,
} from "@/features/configurator/lib/configurator-compatibility";
import type { ConfiguratorModel, ConfiguratorOption } from "@/types/configurator";

const UPSELL_OPTION_SLUGS = [
  "motor-mover",
  "space-heater",
  "100w-solar",
  "ext-240v-socket",
  "usb-upgrade",
  "tv-package",
  "camptech-awning",
] as const;

interface GetUpsellSuggestionsArgs {
  options: ConfiguratorOption[];
  selectedModel: ConfiguratorModel | null;
  selectedOptionIds: string[];
  limit?: number;
}

export function getUpsellSuggestions({
  options,
  selectedModel,
  selectedOptionIds,
  limit = 4,
}: GetUpsellSuggestionsArgs) {
  if (selectedModel === null) {
    return [];
  }

  const selectedOptionIdsSet = new Set(selectedOptionIds);

  return UPSELL_OPTION_SLUGS.map((slug) =>
    options.find((option) => option.slug === slug),
  )
    .filter((option): option is ConfiguratorOption => option !== undefined)
    .filter((option) => option.isActive)
    .filter((option) => !isPackageOption(option))
    .filter((option) => !selectedOptionIdsSet.has(option.id))
    .filter(
      (option) =>
        getOptionAvailabilityState(option, selectedModel, selectedOptionIds, options) ===
        "available",
    )
    .slice(0, limit);
}
